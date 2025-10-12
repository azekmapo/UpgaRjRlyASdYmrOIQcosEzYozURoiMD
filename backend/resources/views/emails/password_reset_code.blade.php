<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation de mot de passe</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
        .content {
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #dee2e6;
            border-radius: 8px;
        }
        .info-section {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }
        .info-section h3 {
            margin-top: 0;
            color: #495057;
            border-bottom: 2px solid #007bff;
            padding-bottom: 5px;
        }
        .detail-row {
            display: flex;
            margin-bottom: 8px;
        }
        .detail-label {
            font-weight: bold;
            min-width: 120px;
            color: #495057;
        }
        .detail-value {
            color: #212529;
        }
        .code-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: #e9ecef;
            border-radius: 8px;
            border: 2px solid #007bff;
        }
        .reset-code {
            font-size: 28px;
            font-weight: bold;
            color: #007bff;
            margin: 10px 0;
            letter-spacing: 3px;
        }
        .alert {
            padding: 12px;
            margin-bottom: 20px;
            border: 1px solid transparent;
            border-radius: 4px;
        }
        .alert-info {
            color: #0c5460;
            background-color: #d1ecf1;
            border-color: #bee5eb;
        }
        .alert-warning {
            color: #856404;
            background-color: #fff3cd;
            border-color: #ffeaa7;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 12px;
            color: #6c757d;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔒 Réinitialisation de Mot de Passe</h1>
    </div>

    <div class="content">
        <div class="info-section">
            <h3>📧 Demande de Réinitialisation</h3>
            <p>Salut,</p>
            <p>Nous avons reçu une demande de réinitialisation de votre mot de passe. Utilisez le code suivant pour le réinitialiser :</p>
        </div>

        <div class="code-section">
            <p><strong>Code de réinitialisation :</strong></p>
            <div class="reset-code">{{ $code }}</div>
        </div>

        <div class="alert alert-warning">
            <strong>Attention :</strong> Ce code expirera dans 1 minute.
        </div>
    </div>

    <div class="footer">
        <p>Pour toute question, veuillez contacter l'administration.</p>
    </div>
</body>
</html>