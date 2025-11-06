<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $isQuote ? 'Árajánlat visszaigazolás' : 'Rendelés visszaigazolás' }}</title>
    <style>
        body { font-family: Arial, sans-serif; color: #222; }
        .container { max-width: 640px; margin: 0 auto; padding: 16px; }
        .muted { color: #666; }
        .items { margin-top: 12px; }
        .item { border-top: 1px solid #eee; padding: 8px 0; }
        .label { font-weight: bold; }
    </style>
    </head>
<body>
<div class="container">
    <h2>{{ $isQuote ? 'Köszönjük az árajánlat kérését!' : 'Köszönjük a rendelését!' }}</h2>

    <p>
        Kedves {{ $order->customer_name }},
    </p>
    <p class="muted">
        {{ $isQuote ? 'Az alábbi tételekre vonatkozó árajánlat kérését rögzítettük.' : 'Az alábbi rendelését rögzítettük.' }}
    </p>

    <div class="items">
        @foreach($order->items as $i)
            <div class="item">
                <div class="label">Termék:</div>
                <div>{{ $i->product->name }} (darab: {{ $i->quantity }})</div>
                @php($opts = $i->options ?? [])
                @if(!empty($opts))
                    <div class="label" style="margin-top:6px;">Testreszabás:</div>
                    <ul>
                        @if(isset($opts['hardware_type']))
                            <li>Vasalat típusa: {{ $opts['hardware_type'] }}</li>
                        @endif
                        @if(isset($opts['color_scheme']))
                            <li>Színösszeállítás: {{ $opts['color_scheme'] }}</li>
                        @endif
                    </ul>
                @endif
                @if(!$isQuote)
                    <div class="muted">Egységár: {{ number_format((float)($i->unit_price ?? 0), 0, ',', ' ') }} Ft</div>
                @endif
            </div>
        @endforeach
    </div>

    @if(!empty($adminNote))
        <div style="margin-top:12px; padding:10px; background:#f8f8f8; border:1px solid #eee;">
            <div class="label">Megjegyzés:</div>
            <div>{{ $adminNote }}</div>
        </div>
    @endif

    @if(!$isQuote)
        <p class="label" style="margin-top:12px;">Összesen: {{ number_format((float)($order->total ?? 0), 0, ',', ' ') }} Ft</p>
    @endif

    <p class="muted" style="margin-top:16px;">
        Hamarosan felvesszük Önnel a kapcsolatot a részletek egyeztetése céljából.
    </p>

    <p class="muted">Üdvözlettel,<br>Elek Design</p>
</div>
</body>
</html>
