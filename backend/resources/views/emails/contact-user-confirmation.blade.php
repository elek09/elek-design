<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8" />
    <title>Üzenet fogadva</title>
    <style>
        body { font-family: Arial, sans-serif; color:#1f2937; }
        .container { max-width:600px; margin:0 auto; padding:24px; }
        h1 { font-size:20px; margin:0 0 16px; }
        p { line-height:1.5; margin:0 0 12px; }
        .muted { font-size:12px; color:#6b7280; }
    </style>
</head>
<body>
<div class="container">
    <h1>Köszönjük megkeresését!</h1>
    @if($name)
        <p>Kedves {{ $name }},</p>
    @endif
    <p>Üzenetét megkaptuk, hamarosan felvesszük Önnel a kapcsolatot.</p>
    <p class="muted">Ezt az automatikus visszaigazolást nem kell megválaszolnia.</p>
</div>
</body>
</html>
