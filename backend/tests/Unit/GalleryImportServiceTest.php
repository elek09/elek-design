<?php

namespace Tests\Unit;

use App\Services\GalleryImportService;
use App\Support\ImportEntry;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class GalleryImportServiceTest extends TestCase
{
    private GalleryImportService $importService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->importService = new GalleryImportService();
        
        Config::set('gallery.keyword_category_map', [
            'konyha' => 'eletter',
            'nappali' => 'eletter',
            'gardrob' => 'eletter',
        ]);
    }

    public function test_parseEntries_felismeri_featured_prefix(): void
    {
        $mockFile = $this->createMockFile('featured_konyha(1)-12345.jpg');
        
        $entries = $this->importService->parseEntries([$mockFile]);
        
        $this->assertCount(1, $entries);
        $this->assertTrue($entries[0]->is_featured);
        $this->assertEquals('Konyha 12345', $entries[0]->title);
    }

    public function test_parseEntries_kinyeri_sorrend_szamot(): void
    {
        $mockFile = $this->createMockFile('nappali(5)-67890.jpg');
        
        $entries = $this->importService->parseEntries([$mockFile]);
        
        $this->assertEquals(5, $entries[0]->order);
    }

    public function test_parseEntries_sorrend_szam_nelkul_nulla(): void
    {
        $mockFile = $this->createMockFile('gardrob-12345.jpg');
        
        $entries = $this->importService->parseEntries([$mockFile]);
        
        $this->assertEquals(0, $entries[0]->order);
    }

    public function test_parseEntries_helyes_kategoria_meghatározas(): void
    {
        $mockFile = $this->createMockFile('konyha(1)-12345.jpg');
        
        $entries = $this->importService->parseEntries([$mockFile]);
        
        $this->assertEquals('eletter', $entries[0]->category);
    }

    public function test_parseEntries_ismeretlen_kategoria_eseten_egyeb(): void
    {
        $mockFile = $this->createMockFile('valami-mas(1).jpg');
        
        $entries = $this->importService->parseEntries([$mockFile]);
        
        $this->assertEquals('egyeb', $entries[0]->category);
    }

    public function test_dedupe_eltavolitja_duplikatumokat(): void
    {
        $mockFile1 = $this->createMockFile('konyha(1).jpg');
        $mockFile2 = $this->createMockFile('konyha(1).jpg');
        
        $entries = [
            new ImportEntry($mockFile1, 'eletter', 'Konyha 1', 1, false),
            new ImportEntry($mockFile2, 'eletter', 'Konyha 1', 1, false),
        ];
        
        $deduped = $this->importService->dedupe($entries);
        
        $this->assertCount(1, $deduped);
    }

    public function test_dedupe_featured_elsobb_sima_verzional(): void
    {
        $mockFile1 = $this->createMockFile('konyha(1).jpg');
        $mockFile2 = $this->createMockFile('featured_konyha(1).jpg');
        
        $plainEntry = new ImportEntry($mockFile1, 'eletter', 'Konyha 1', 1, false);
        $featuredEntry = new ImportEntry($mockFile2, 'eletter', 'Konyha 1', 1, true);
        
        $deduped = $this->importService->dedupe([$plainEntry, $featuredEntry]);
        
        $this->assertCount(1, $deduped);
        $this->assertTrue($deduped[0]->is_featured);
    }

    public function test_dedupe_kulon_kategoriak_nem_duplikat(): void
    {
        $mockFile1 = $this->createMockFile('konyha(1).jpg');
        $mockFile2 = $this->createMockFile('nappali(1).jpg');
        
        $entries = [
            new ImportEntry($mockFile1, 'eletter', 'Teszt', 1, false),
            new ImportEntry($mockFile2, 'uzletter', 'Teszt', 1, false),
        ];
        
        $deduped = $this->importService->dedupe($entries);
        
        $this->assertCount(2, $deduped);
    }

    private function createMockFile(string $filename): \Symfony\Component\Finder\SplFileInfo
    {
        $tmpDir = sys_get_temp_dir() . '/gallery_test';
        if (!is_dir($tmpDir)) {
            mkdir($tmpDir, 0777, true);
        }
        
        $tmpFile = $tmpDir . '/' . $filename;
        touch($tmpFile);
        
        return new \Symfony\Component\Finder\SplFileInfo(
            $tmpFile,
            $tmpDir,
            $filename
        );
    }
}
