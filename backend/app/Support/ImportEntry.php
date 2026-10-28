<?php

namespace App\Support;

use Symfony\Component\Finder\SplFileInfo;

class ImportEntry
{
    public function __construct(
        public readonly SplFileInfo $file,
        public readonly string $category,
        public readonly string $title,
        public readonly int $order,
        public readonly bool $is_featured,
    ) {}

    public function key(): string
    {
        return $this->category . '|' . $this->title;
    }
}
