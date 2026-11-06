<?php

namespace App\Controller\Mcp;

use App\Entity\Main\User;
use App\Repository\Running\RuActivityRepository;
use App\Repository\Running\RuLogRepository;
use App\Repository\Running\RuWeightRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * SKETCH — serveur MCP (Streamable HTTP, JSON-RPC 2.0) en LECTURE SEULE pour le module running.
 * Destiné à être ajouté comme connecteur personnalisé dans claude.ai.
 *
 * Reste à faire (non couvert ici) :
 *  - rate limiter + log des appels.
 */
#[Route('/mcp/running', name: 'mcp_running')]
class RunningMcpController extends AbstractController
{
    private const PROTOCOL_VERSION = '2025-06-18';
    private const MAX_RANGE_DAYS = 400;

    public function __construct(
        private readonly RuLogRepository $logRepository,
        private readonly RuActivityRepository $activityRepository,
        private readonly RuWeightRepository $weightRepository,
        #[Autowire('%kernel.project_dir%')] private readonly string $projectDir,
    ) {
    }

    #[Route('', name: '', methods: ['POST'])]
    public function handle(Request $request): Response
    {
        $this->denyAccessUnlessGranted('ROLE_RUNNING');
        $this->denyAccessUnlessGranted('ROLE_OAUTH2_RUNNING:READ'); // scope `running:read`

        $message = json_decode($request->getContent(), true);
        if (!is_array($message) || ($message['jsonrpc'] ?? null) !== '2.0') {
            return $this->rpcError(null, -32600, 'Invalid Request');
        }

        $id = $message['id'] ?? null;
        $method = $message['method'] ?? '';

        // Notifications (ex. notifications/initialized) : pas de réponse JSON-RPC.
        if ($id === null) {
            return new Response('', Response::HTTP_ACCEPTED);
        }

        return match ($method) {
            'initialize' => $this->rpcResult($id, [
                'protocolVersion' => self::PROTOCOL_VERSION,
                'capabilities' => ['tools' => new \stdClass()],
                'serverInfo' => ['name' => 'nompaw-running', 'version' => '0.1.0'],
            ]),
            'ping' => $this->rpcResult($id, new \stdClass()),
            'tools/list' => $this->rpcResult($id, ['tools' => $this->toolDefinitions()]),
            'tools/call' => $this->callTool($id, $message['params'] ?? []),
            default => $this->rpcError($id, -32601, 'Method not found'),
        };
    }

    // Pas de flux serveur→client : le transport Streamable HTTP autorise de répondre 405 au GET.
    #[Route('', name: '_get', methods: ['GET'])]
    public function noStream(): Response
    {
        return new Response('', Response::HTTP_METHOD_NOT_ALLOWED, ['Allow' => 'POST']);
    }

    private function toolDefinitions(): array
    {
        $range = [
            'type' => 'object',
            'properties' => [
                'from' => ['type' => 'string', 'format' => 'date', 'description' => 'Début (YYYY-MM-DD), défaut : il y a 28 jours'],
                'to' => ['type' => 'string', 'format' => 'date', 'description' => 'Fin (YYYY-MM-DD), défaut : aujourd\'hui'],
            ],
        ];
        $readOnly = ['readOnlyHint' => true, 'destructiveHint' => false, 'openWorldHint' => false];

        return [
            [
                'name' => 'get_training_context',
                'description' => 'Profil, zones FC, lignes d\'allure, courses cibles et règles de décision du plan (docs/RUNNING_CONTEXT.md). À lire avant de proposer un ajustement.',
                'inputSchema' => ['type' => 'object', 'properties' => new \stdClass()],
                'annotations' => $readOnly,
            ],
            [
                'name' => 'get_logs',
                'description' => 'Séances saisies du plan (réalisé : km, durée, FC, RPE, note, done) sur une période.',
                'inputSchema' => $range,
                'annotations' => $readOnly,
            ],
            [
                'name' => 'get_activities',
                'description' => 'Historique des activités importées de Garmin (date, km, secondes, FC moyenne/max, titre) sur une période.',
                'inputSchema' => $range,
                'annotations' => $readOnly,
            ],
            [
                'name' => 'get_weights',
                'description' => 'Pesées (kg) sur une période.',
                'inputSchema' => $range,
                'annotations' => $readOnly,
            ],
            [
                'name' => 'get_notes',
                'description' => 'Notes libres de suivi running.',
                'inputSchema' => ['type' => 'object', 'properties' => new \stdClass()],
                'annotations' => $readOnly,
            ],
        ];
    }

    private function callTool(mixed $id, array $params): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $args = is_array($params['arguments'] ?? null) ? $params['arguments'] : [];

        try {
            $data = match ($params['name'] ?? '') {
                'get_training_context' => $this->trainingContext(),
                'get_logs' => $this->logs($user, ...$this->period($args)),
                'get_activities' => $this->activities($user, ...$this->period($args)),
                'get_weights' => $this->weights($user, ...$this->period($args)),
                'get_notes' => $user->getRunningNotes() ?? '',
                default => null,
            };
        } catch (\InvalidArgumentException $e) {
            return $this->toolResult($id, $e->getMessage(), true);
        }

        if ($data === null) {
            return $this->rpcError($id, -32602, 'Unknown tool');
        }

        $text = is_string($data) ? $data : json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return $this->toolResult($id, $text, false);
    }

    /** @return array{0: \DateTimeImmutable, 1: \DateTimeImmutable} */
    private function period(array $args): array
    {
        $to = $this->parseDate($args['to'] ?? null) ?? new \DateTimeImmutable('today');
        $from = $this->parseDate($args['from'] ?? null) ?? $to->modify('-28 days');

        if ($from > $to) {
            throw new \InvalidArgumentException('`from` doit précéder `to`.');
        }
        if ($from->diff($to)->days > self::MAX_RANGE_DAYS) {
            throw new \InvalidArgumentException('Période limitée à ' . self::MAX_RANGE_DAYS . ' jours.');
        }

        return [$from, $to];
    }

    private function parseDate(mixed $value): ?\DateTimeImmutable
    {
        if ($value === null || $value === '') {
            return null;
        }
        $date = is_string($value) ? \DateTimeImmutable::createFromFormat('!Y-m-d', $value) : false;
        if ($date === false) {
            throw new \InvalidArgumentException('Date invalide (format attendu : YYYY-MM-DD).');
        }

        return $date;
    }

    private function logs(User $user, \DateTimeImmutable $from, \DateTimeImmutable $to): array
    {
        $out = [];
        foreach ($this->logRepository->findAllByUser($user) as $e) {
            if (!$this->inRange($e->getDate(), $from, $to)) {
                continue;
            }
            $out[] = [
                'date' => $e->getDate()->format('Y-m-d'),
                'title' => $e->getTitle(),
                'done' => $e->isDone(),
                'km' => $e->getKm(),
                'durationSec' => $e->getDurationSec(),
                'hr' => $e->getHr(),
                'hrMax' => $e->getHrMax(),
                'rpe' => $e->getRpe(),
                'note' => $e->getNote(),
                'source' => $e->getSource(),
            ];
        }

        return $out;
    }

    private function activities(User $user, \DateTimeImmutable $from, \DateTimeImmutable $to): array
    {
        $out = [];
        foreach ($this->activityRepository->findAllByUser($user) as $a) {
            if (!$this->inRange($a->getDate(), $from, $to)) {
                continue;
            }
            $out[] = [
                'date' => $a->getDate()->format('Y-m-d'),
                'title' => $a->getTitle(),
                'km' => $a->getKm(),
                'durationSec' => $a->getDurationSec(),
                'hr' => $a->getHr(),
                'hrMax' => $a->getHrMax(),
            ];
        }

        return $out;
    }

    private function weights(User $user, \DateTimeImmutable $from, \DateTimeImmutable $to): array
    {
        $out = [];
        foreach ($this->weightRepository->findAllByUser($user) as $w) {
            if ($this->inRange($w->getDate(), $from, $to)) {
                $out[] = ['date' => $w->getDate()->format('Y-m-d'), 'kg' => $w->getKg(), 'source' => $w->getSource()];
            }
        }

        return $out;
    }

    private function trainingContext(): string
    {
        $path = $this->projectDir . '/docs/RUNNING_CONTEXT.md';

        return is_file($path) ? file_get_contents($path) : 'Contexte indisponible.';
    }

    private function inRange(\DateTimeInterface $date, \DateTimeImmutable $from, \DateTimeImmutable $to): bool
    {
        $d = \DateTimeImmutable::createFromInterface($date)->setTime(0, 0);

        return $d >= $from && $d <= $to;
    }

    private function toolResult(mixed $id, string $text, bool $isError): JsonResponse
    {
        return $this->rpcResult($id, ['content' => [['type' => 'text', 'text' => $text]], 'isError' => $isError]);
    }

    private function rpcResult(mixed $id, mixed $result): JsonResponse
    {
        return new JsonResponse(['jsonrpc' => '2.0', 'id' => $id, 'result' => $result]);
    }

    private function rpcError(mixed $id, int $code, string $message): JsonResponse
    {
        return new JsonResponse(['jsonrpc' => '2.0', 'id' => $id, 'error' => ['code' => $code, 'message' => $message]]);
    }
}
