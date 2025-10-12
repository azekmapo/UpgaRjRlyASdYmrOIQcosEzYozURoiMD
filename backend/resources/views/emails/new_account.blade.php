<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue</title>
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
        .credentials-section {
            margin: 30px 0;
            padding: 20px;
            background-color: #e9ecef;
            border-radius: 8px;
            border: 2px solid #007bff;
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
        <h1>🎉 Bienvenue, {{ $name }}!</h1>
    </div>

    <div class="content">
        <div class="alert alert-info">
            <strong>Information :</strong> Un compte a été créé pour vous sur notre plateforme de gestion de projets de fin d'études en tant que {{ $role }}.
        </div>

        <div class="credentials-section">
            <h3>🔑 Vos Informations de Connexion</h3>
            <div class="detail-row">
                <span class="detail-label">Email :</span>
                <span class="detail-value">{{ $email }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Mot de passe :</span>
                <span class="detail-value">{{ $password }}</span>
            </div>
        </div>

        <div class="alert alert-warning">
            <strong>Recommandation :</strong> Nous vous recommandons de changer votre mot de passe après votre première connexion.
        </div>

        <div class="info-section">
            <h3>🚀 Prochaines Étapes</h3>
            <p>Vous pouvez maintenant vous connecter à votre compte en utilisant les informations ci-dessus.</p>
            <p>Merci de nous rejoindre !</p>
        </div>
    </div>

    <div class="footer">
        <p>Pour toute question, veuillez contacter l'administration.</p>
    </div>
</body>
</html>