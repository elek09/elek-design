<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Árajánlat elutasítva</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, 'Helvetica Neue', sans-serif; color:#111827; }
        .container { max-width: 640px; margin: 0 auto; padding: 24px; }
        h1 { font-size: 20px; margin: 0 0 12px; }
        p { margin: 0 0 8px; line-height: 1.5; }
        .muted { color:#6b7280; font-size: 12px; }
        .section { margin-top: 16px; padding-top: 8px; border-top: 1px solid #e5e7eb; }
        table { width:100%; border-collapse: collapse; }
        th, td { text-align:left; padding:8px 0; border-bottom:1px solid #f3f4f6; }
        th { color:#6b7280; font-weight:600; font-size: 12px; text-transform: uppercase; }
        .note { background:#fef2f2; border:1px solid #fecaca; padding:12px; border-radius:6px; }
    </style>
</head>
<body>
<div class="container">
    <h1>Árajánlat elutasítva</h1>

    @php($isModel = $order instanceof \App\Models\Order)

    @if($isModel)
        <p>Kedves {{ $order->customer_name ?? 'Vásárló' }},</p>
        <p>Sajnálattal értesítjük, hogy az alábbi árajánlati kérését nem tudjuk elfogadni:</p>

        <div class="section">
            <table role="presentation">
                <thead>
                <tr>
                    <th>Termék</th>
                    <th>Mennyiség</th>
                </tr>
                </thead>
                <tbody>
                @foreach($order->items as $item)
                    <tr>
                        <td>{{ $item->product->name ?? ('#'.$item->product_id) }}</td>
                        <td>{{ $item->quantity }} db</td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
    @endif

    @if(!empty($adminNote))
        <div class="section note">
            <strong>Indoklás:</strong>
            <div>{!! nl2br(e($adminNote)) !!}</div>
        </div>
    @else
        <div class="section">
            <p>Sajnos jelenleg nem áll módunkban teljesíteni ezt a megrendelést. Köszönjük megértését!</p>
        </div>
    @endif

    <div class="section">
        <p>Ha kérdése van, vagy más projektet szeretne megbeszélni, kérjük vegye fel velünk a kapcsolatot!</p>
    </div>

    <div class="section" style="border-top:1px solid #e5e7eb; padding-top:12px; margin-top:24px;">
        <p>Üdvözlettel,</p>
        <p><strong>Elek Imre</strong><br/>
            E-mail: {{ config('mail.from.address') }}<br/>
            Web: {{ rtrim((string) config('app.url'), '/') }}
        </p>
        <div style="margin-top:12px; text-align:left;">
            <img src="{{ $message->embed(public_path('images/elek-design-logo.jpg')) }}" alt="Elek Design" style="max-height:42px; width:auto;"/>
        </div>
    </div>

    <div class="section">
        <p class="muted">Ez egy automatikus üzenet. Kérdés esetén válaszoljon erre az e-mailre.</p>
    </div>
</div>
</body>
</html>
