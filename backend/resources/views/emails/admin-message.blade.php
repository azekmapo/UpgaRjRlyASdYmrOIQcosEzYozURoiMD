<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $sujet }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #212529;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background-color: #111827;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
            color: white;
            font-size: 1.3em;
            font-weight: bold;
        }

        .content {
            background-color: #f8f9fa;
            padding: 20px;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            font-size: 14px;
            line-height: 1.6;
            word-break: break-word;
        }

        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 12px;
            color: #6c757d;
            text-align: center;
        }

        .spec-value {
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <div class="header">📧 {{ $sujet }}</div>

    <div class="content spec-value">
        {!! nl2br(str_replace(' ', ' &nbsp;', e($contenu))) !!}
    </div>

    <div class="footer">
        <p>Cet email vous a été envoyé automatiquement par la plateforme.</p>
    </div>
</body>
</html>
