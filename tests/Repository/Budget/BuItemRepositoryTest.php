<?php

namespace App\Tests\Repository\Budget;

use App\Entity\Budget\BuItem;
use App\Entity\Enum\Budget\TypeType;
use App\Entity\Main\Society;
use App\Entity\Main\User;
use App\Repository\Budget\BuItemRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

class BuItemRepositoryTest extends KernelTestCase
{
    private EntityManagerInterface $em;
    private array $createdEntityRefs = [];

    protected function setUp(): void
    {
        self::bootKernel();
        $this->em = self::getContainer()->get(EntityManagerInterface::class);
    }

    protected function tearDown(): void
    {
        foreach (array_reverse($this->createdEntityRefs) as [$class, $id]) {
            $entity = $this->em->getRepository($class)->find($id);
            if ($entity) {
                $this->em->remove($entity);
            }
        }
        $this->em->flush();

        parent::tearDown();
    }

    private function createUser(): User
    {
        $society = (new Society())
            ->setName('Society repo-test')
            ->setManager('default')
            ->setDirname('default')
            ->setCode(substr('t' . uniqid(), 0, 20))
            ->setIsActivated(true)
            ->setIsGenerated(true)
            ->setIsBlocked(false)
        ;
        $this->em->persist($society);

        $user = (new User())
            ->setUsername('repo-test-' . uniqid())
            ->setDisplayName('Repo Test')
            ->setRoles(['ROLE_USER'])
            ->setPassword('not-checked')
            ->setEmail(uniqid() . '@example.test')
            ->setLastname('Test')
            ->setSociety($society)
        ;
        $this->em->persist($user);
        $this->em->flush();

        $this->createdEntityRefs[] = [User::class, $user->getId()];
        $this->createdEntityRefs[] = [Society::class, $society->getId()];

        return $user;
    }

    private function createItem(User $user, int $year, TypeType $type, float $price): BuItem
    {
        $item = (new BuItem())
            ->setYear($year)
            ->setMonth(1)
            ->setType($type)
            ->setLastType($type)
            ->setPrice($price)
            ->setName('x')
            ->setIsActive(true)
            ->setDateAt(new \DateTime())
            ->setUser($user)
        ;
        $this->em->persist($item);
        $this->em->flush();

        $this->createdEntityRefs[] = [BuItem::class, $item->getId()];

        return $item;
    }

    public function testFindByUserAndTypeUpToYearExcludesFutureYears(): void
    {
        /** @var BuItemRepository $repository */
        $repository = $this->em->getRepository(BuItem::class);

        $user = $this->createUser();
        $this->createItem($user, 2023, TypeType::Saving, 100.0);
        $this->createItem($user, 2025, TypeType::Saving, 200.0);
        $this->createItem($user, 2027, TypeType::Saving, 9999.0); // must be excluded
        $this->createItem($user, 2025, TypeType::Expense, 9999.0); // wrong type, must be excluded

        $result = $repository->findByUserAndTypeUpToYear($user, TypeType::Saving, 2025);

        self::assertCount(2, $result);
        $prices = array_map(static fn (BuItem $item) => $item->getPrice(), $result);
        sort($prices);
        self::assertSame([100.0, 200.0], $prices);
    }
}
