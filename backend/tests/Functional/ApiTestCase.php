<?php

namespace App\Tests\Functional;

use App\DataFixtures\AppFixtures;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;
use Symfony\Component\HttpFoundation\Response;

/**
 * Socle des tests d'intégration de l'API : base `fitbook_test` recréée et fixtures chargées
 * une fois par exécution, requêtes JSON et connexion JWT.
 */
abstract class ApiTestCase extends WebTestCase
{
    private static bool $databaseReady = false;
    protected KernelBrowser $client;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        if (!self::$databaseReady) {
            $this->resetDatabase();
            self::$databaseReady = true;
        }
    }

    private function resetDatabase(): void
    {
        $app = new Application(static::$kernel);
        $app->setAutoExit(false);
        foreach ([
            ['command' => 'doctrine:schema:drop', '--force' => true, '--full-database' => true],
            ['command' => 'doctrine:schema:create'],
            ['command' => 'doctrine:fixtures:load', '--no-interaction' => true],
        ] as $input) {
            $output = new BufferedOutput();
            $code = $app->run(new ArrayInput($input), $output);
            self::assertSame(0, $code, $input['command'].' a échoué : '.$output->fetch());
        }
    }

    protected function em(): EntityManagerInterface
    {
        return static::getContainer()->get(EntityManagerInterface::class);
    }

    /** @param array<string, mixed>|null $body */
    protected function request(string $method, string $uri, ?array $body = null, ?string $token = null): Response
    {
        $server = ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'];
        if ($token !== null) {
            $server['HTTP_AUTHORIZATION'] = 'Bearer '.$token;
        }
        $this->client->request($method, $uri, [], [], $server, $body === null ? null : json_encode($body, JSON_THROW_ON_ERROR));

        return $this->client->getResponse();
    }

    /** @return array<string, mixed> */
    protected function json(Response $response): array
    {
        $data = json_decode((string) $response->getContent(), true);
        self::assertIsArray($data, 'Réponse JSON attendue, reçu : '.substr((string) $response->getContent(), 0, 300));

        return $data;
    }

    protected function login(string $email, string $password = AppFixtures::PASSWORD): string
    {
        $response = $this->request('POST', '/api/auth/login', ['email' => $email, 'password' => $password]);
        self::assertSame(200, $response->getStatusCode(), 'Connexion impossible pour '.$email.' : '.$response->getContent());

        return $this->json($response)['token'];
    }
}
