<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8" />
    <title>Új üzenet érkezett</title>
    <style>
        body { font-family: Arial, sans-serif; color:#222; }
        .container { max-width:600px; margin:0 auto; }
        h1 { font-size:20px; }
        p { line-height:1.4; }
        .meta { font-size:12px; color:#666; margin-top:20px; }
        pre { white-space:pre-wrap; font-family:inherit; }
    </style>
</head>
<body>
<div class="container">
    <h1>Új kapcsolatfelvételi üzenet</h1>
    <p><strong>Név:</strong> {{ $name }}</p>
    <p><strong>Email:</strong> {{ $email }}</p>
    <p><strong>Tárgy:</strong> {{ $subject }}</p>
    <hr />
    <p><strong>Üzenet:</strong></p>
    <pre>{{ $message_text }}</pre>
    <p class="meta">IP: {{ $ip }} | Küldve: {{ $sent_at }}</p>
</div>
</body>
</html>
