<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Új árajánlat érkezett</title>
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
        .badge { display:inline-block; background:#eef2ff; color:#3730a3; padding:2px 8px; border-radius:9999px; font-size:12px; }
    </style>
</head>
<body>
<div class="container">
    <h1>Új árajánlat érkezett <span class="badge">#{{ $order->id }}</span></h1>

    @php($adminBase = rtrim((string) (config('services.admin_app_url') ?: config('app.url')), '/'))
    <p>
        <a class="button" href="{{ $adminBase }}/admin/orders" target="_blank" rel="noopener" style="display:inline-block;background:#111827;color:#fff !important;text-decoration:none;padding:8px 12px;border-radius:6px;font-weight:600;">Megnyitás az Admin felületen</a>
    </p>

    <div class="section">
        <p><strong>Név:</strong> {{ $order->customer_name }}</p>
        <p><strong>Email:</strong> {{ $order->customer_email }}</p>
        @if(!empty($order->customer_phone))
            <p><strong>Telefon:</strong> {{ $order->customer_phone }}</p>
        @endif
        <p><strong>Beérkezett:</strong> {{ $order->created_at }}</p>
    </div>

    <div class="section">
        <table role="presentation">
            <thead>
            <tr>
                <th>Termék</th>
                <th>Mennyiség</th>
                <th>Egységár</th>
            </tr>
            </thead>
            <tbody>
            @foreach($order->items as $item)
                <tr>
                    <td>{{ $item->product->name ?? ('#'.$item->product_id) }}</td>
                    <td>{{ $item->quantity }}</td>
                    <td>{{ is_null($item->unit_price) ? '-' : (number_format((float)$item->unit_price, 0, ',', ' ').' Ft') }}</td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>

    @if(!empty($order->admin_note))
        <div class="section">
            <p><strong>Admin megjegyzés:</strong> {!! nl2br(e($order->admin_note)) !!}</p>
        </div>
    @endif
    <!-- Signature & Footer -->
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
