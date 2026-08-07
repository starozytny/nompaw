<?php

namespace App\Tests\Controller\User\Budget;

use App\Entity\Budget\BuItem;
use App\Entity\Enum\Budget\TypeType;
use App\Entity\Main\Society;
use App\Entity\Main\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\DomCrawler\Crawler;

/**
 * Confirms the server-rendered page (the one users actually load in a browser) carries a
 * correctly shaped payload for React to hydrate: this is the one link in the chain
 * (controller -> BudgetService -> Twig -> data-* attributes) not already covered by the
 * InternApi JSON tests.
 */
class BudgetControllerTest extends WebTestCase
{
    private EntityManagerInterface $em;
    private array $createdEntityRefs = [];

    protected function tearDown(): void
    {
        if (isset($this->em)) {
            foreach (array_reverse($this->createdEntityRefs) as [$class, $id]) {
                $entity = $this->em->getRepository($class)->find($id);
                if ($entity) {
                    $this->em->remove($entity);
                }
            }
            $this->em->flush();
        }

        parent::tearDown();
    }

    private function createUser(string $suffix): User
    {
        $society = (new Society())
            ->setName('Society ' . $suffix)
            ->setManager('default')
            ->setDirname('default')
            ->setCode(substr('soc-' . $suffix, 0, 20))
            ->setIsActivated(true)
            ->setIsGenerated(true)
            ->setIsBlocked(false)
        ;
        $this->em->persist($society);

        $user = (new User())
            ->setUsername('user-' . $suffix)
            ->setDisplayName('User ' . $suffix)
            ->setRoles(['ROLE_USER'])
            ->setPassword('not-checked-by-loginUser')
            ->setEmail($suffix . '@example.test')
            ->setLastname('Test')
            ->setSociety($society)
            ->setBudgetInit(500.0)
            ->setBudgetYear(2026)
        ;
        $this->em->persist($user);
        $this->em->flush();

        $this->createdEntityRefs[] = [User::class, $user->getId()];
        $this->createdEntityRefs[] = [Society::class, $society->getId()];

        return $user;
    }

    public function testPlanningPageRendersHydrationPayloadForReact(): void
    {
        $client = static::createClient();
        $this->em = self::getContainer()->get(EntityManagerInterface::class);

        $owner = $this->createUser('page-owner');

        $item = (new BuItem())
            ->setYear(2026)->setMonth(1)->setType(TypeType::Expense)->setLastType(TypeType::Expense)
            ->setPrice(150.0)->setName('Loyer')->setIsActive(true)->setDateAt(new \DateTime())
            ->setUser($owner)
        ;
        $this->em->persist($item);
        $this->em->flush();
        $this->createdEntityRefs[] = [BuItem::class, $item->getId()];

        $client->loginUser($owner);
        $crawler = $client->request('GET', '/espace-membre/planificateur/planning/2026');

        self::assertSame(200, $client->getResponse()->getStatusCode());

        /** @var Crawler $mount */
        $mount = $crawler->filter('#budget');
        self::assertCount(1, $mount);

        $monthlyBalances = json_decode($mount->attr('data-monthly-balances'), true);
        $monthlySummaries = json_decode($mount->attr('data-monthly-summaries'), true);
        $savingsSummaries = json_decode($mount->attr('data-savings-summaries'), true);
        $donnees = json_decode($mount->attr('data-donnees'), true);

        self::assertCount(12, $monthlyBalances);
        self::assertCount(12, $monthlySummaries);
        self::assertIsArray($savingsSummaries);
        self::assertCount(1, $donnees);

        // 500 (init) - 150 (January expense) = 350.
        self::assertEqualsWithDelta(350.0, $monthlyBalances[0], 0.001);
        self::assertEqualsWithDelta(150.0, $monthlySummaries[0]['totalExpense'], 0.001);
    }
}
