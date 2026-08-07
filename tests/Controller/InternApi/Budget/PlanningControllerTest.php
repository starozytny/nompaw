<?php

namespace App\Tests\Controller\InternApi\Budget;

use App\Entity\Budget\BuItem;
use App\Entity\Enum\Budget\TypeType;
use App\Entity\Main\Society;
use App\Entity\Main\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class PlanningControllerTest extends WebTestCase
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

    private function createItem(User $owner, int $year, int $month, float $price): BuItem
    {
        $item = (new BuItem())
            ->setYear($year)
            ->setMonth($month)
            ->setType(TypeType::Expense)
            ->setLastType(TypeType::Expense)
            ->setPrice($price)
            ->setName('Test item')
            ->setIsActive(true)
            ->setDateAt(new \DateTime())
            ->setUser($owner)
        ;
        $this->em->persist($item);
        $this->em->flush();

        $this->createdEntityRefs[] = [BuItem::class, $item->getId()];

        return $item;
    }

    public function testPlanningReturnsComputedTotalsScopedToTheCurrentUser(): void
    {
        $client = static::createClient();
        $this->em = self::getContainer()->get(EntityManagerInterface::class);

        $owner = $this->createUser('planning-owner');
        $other = $this->createUser('planning-other');

        $this->createItem($owner, 2026, 1, 200.0);
        $this->createItem($other, 2026, 1, 9999.0); // must not leak into owner's payload

        $client->loginUser($owner);
        $client->request('GET', '/intern/api/budget/planning/2026');

        self::assertSame(200, $client->getResponse()->getStatusCode());

        $data = json_decode($client->getResponse()->getContent(), true);

        self::assertCount(12, $data['monthlyBalances']);
        self::assertCount(12, $data['monthlySummaries']);
        // json_decode collapses whole-number floats to int, hence assertEquals rather than assertSame here.
        self::assertEquals(200.0, $data['monthlySummaries'][0]['totalExpense']);
        // 500 (init) - 200 (owner's expense) = 300; the other user's item must not be counted.
        self::assertEquals(300.0, $data['monthlyBalances'][0]);
        self::assertCount(1, $data['donnees']);
    }
}
