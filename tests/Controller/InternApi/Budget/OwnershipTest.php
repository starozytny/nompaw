<?php

namespace App\Tests\Controller\InternApi\Budget;

use App\Entity\Budget\BuCategory;
use App\Entity\Budget\BuRecurrent;
use App\Entity\Enum\Budget\TypeType;
use App\Entity\Main\Society;
use App\Entity\Main\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Regression coverage for the IDOR fix: a user must never be able to read, edit,
 * delete or take ownership of another user's budget category/recurrence by guessing its id.
 */
class OwnershipTest extends WebTestCase
{
    private EntityManagerInterface $em;
    private array $createdEntityRefs = [];

    protected function setUp(): void
    {
        parent::setUp();
        self::ensureKernelShutdown();
    }

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
            ->setCode('soc-' . $suffix)
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
        ;
        $this->em->persist($user);
        $this->em->flush();

        $this->createdEntityRefs[] = [User::class, $user->getId()];
        $this->createdEntityRefs[] = [Society::class, $society->getId()];

        return $user;
    }

    private function createCategoryFor(User $owner): BuCategory
    {
        $category = (new BuCategory())
            ->setType(TypeType::Expense)
            ->setName('Alimentation')
            ->setUser($owner)
        ;
        $this->em->persist($category);
        $this->em->flush();

        $this->createdEntityRefs[] = [BuCategory::class, $category->getId()];

        return $category;
    }

    private function createRecurrentFor(User $owner): BuRecurrent
    {
        $recurrent = (new BuRecurrent())
            ->setType(TypeType::Expense)
            ->setPrice(850.0)
            ->setName('Loyer')
            ->setMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
            ->setInitYear(2026)
            ->setInitMonth(1)
            ->setUser($owner)
        ;
        $this->em->persist($recurrent);
        $this->em->flush();

        $this->createdEntityRefs[] = [BuRecurrent::class, $recurrent->getId()];

        return $recurrent;
    }

    public function testUserCannotUpdateAnotherUsersCategory(): void
    {
        $client = static::createClient();
        $this->em = self::getContainer()->get(EntityManagerInterface::class);

        $owner = $this->createUser('cat-owner-a');
        $attacker = $this->createUser('cat-attacker-a');
        $category = $this->createCategoryFor($owner);

        $client->loginUser($attacker);
        $client->jsonRequest('PUT', '/intern/api/budget/categories/update/' . $category->getId(), [
            'type' => 0,
            'name' => 'Hijacked',
            'goal' => null,
        ]);

        self::assertSame(403, $client->getResponse()->getStatusCode());

        $this->em->refresh($category);
        self::assertSame($owner->getId(), $category->getUser()->getId());
        self::assertSame('Alimentation', $category->getName());
    }

    public function testUserCannotDeleteAnotherUsersCategory(): void
    {
        $client = static::createClient();
        $this->em = self::getContainer()->get(EntityManagerInterface::class);

        $owner = $this->createUser('cat-owner-b');
        $attacker = $this->createUser('cat-attacker-b');
        $category = $this->createCategoryFor($owner);

        $client->loginUser($attacker);
        $client->request('DELETE', '/intern/api/budget/categories/delete/' . $category->getId());

        self::assertSame(403, $client->getResponse()->getStatusCode());
        self::assertNotNull($this->em->getRepository(BuCategory::class)->find($category->getId()));
    }

    public function testOwnerCanUpdateTheirOwnCategory(): void
    {
        $client = static::createClient();
        $this->em = self::getContainer()->get(EntityManagerInterface::class);

        $owner = $this->createUser('cat-owner-c');
        $category = $this->createCategoryFor($owner);

        $client->loginUser($owner);
        $client->jsonRequest('PUT', '/intern/api/budget/categories/update/' . $category->getId(), [
            'type' => 0,
            'name' => 'Renamed',
            'goal' => null,
        ]);

        self::assertSame(200, $client->getResponse()->getStatusCode());

        $this->em->refresh($category);
        self::assertSame('Renamed', $category->getName());
    }

    public function testUserCannotUpdateAnotherUsersRecurrence(): void
    {
        $client = static::createClient();
        $this->em = self::getContainer()->get(EntityManagerInterface::class);

        $owner = $this->createUser('rec-owner-a');
        $attacker = $this->createUser('rec-attacker-a');
        $recurrent = $this->createRecurrentFor($owner);

        $client->loginUser($attacker);
        $client->jsonRequest('PUT', '/intern/api/budget/recurrences/update/' . $recurrent->getId(), [
            'type' => 0,
            'price' => 1.0,
            'name' => 'Hijacked',
            'category' => '',
            'months' => [1],
            'initYear' => 2026,
            'initMonth' => 1,
        ]);

        self::assertSame(403, $client->getResponse()->getStatusCode());

        $this->em->refresh($recurrent);
        self::assertSame($owner->getId(), $recurrent->getUser()->getId());
        self::assertSame('Loyer', $recurrent->getName());
    }

    public function testUserCannotDeleteAnotherUsersRecurrence(): void
    {
        $client = static::createClient();
        $this->em = self::getContainer()->get(EntityManagerInterface::class);

        $owner = $this->createUser('rec-owner-b');
        $attacker = $this->createUser('rec-attacker-b');
        $recurrent = $this->createRecurrentFor($owner);

        $client->loginUser($attacker);
        $client->request('DELETE', '/intern/api/budget/recurrences/delete/' . $recurrent->getId());

        self::assertSame(403, $client->getResponse()->getStatusCode());
        self::assertNotNull($this->em->getRepository(BuRecurrent::class)->find($recurrent->getId()));
    }
}
