<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attribution de votre Thème PFE</title>
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
        .members-list {
            list-style: none;
            padding: 0;
            margin: 5px 0;
        }
        .members-list li {
            padding: 3px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .members-list li:last-child {
            border-bottom: none;
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
        .alert-success {
            color: #155724;
            background-color: #d4edda;
            border-color: #c3e6cb;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
            color: #495057;
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
        <h1>🎓 Attribution de votre Thème PFE</h1>
    </div>

    <div class="content">
        <div class="greeting">
            <p>Cher(e) {{ $student->name }},</p>
        </div>

        <div class="alert alert-success">
            <strong>Félicitations !</strong> Nous avons le plaisir de vous informer que votre thème PFE a été attribué.
        </div>

        <!-- Informations du thème -->
        <div class="info-section">
            <h3>📋 Détails du Thème</h3>
            <div class="detail-row">
                <span class="detail-label">Intitulé :</span>
                <span class="detail-value">{{ $theme->intitule }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Résumé :</span>
                <span class="detail-value">{{ $theme->resume }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Type :</span>
                <span class="detail-value">{{ ucfirst($theme->type_sujet) }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Technologies utilisées :</span>
                <span class="detail-value">{{ $theme->technologies_utilisees }}</span>
            </div>
            @if($theme->besoins_materiels)
                <div class="detail-row">
                    <span class="detail-label">Besoins matériels :</span>
                    <span class="detail-value">{{ $theme->besoins_materiels }}</span>
                </div>
            @endif
        </div>

        <!-- Encadrement -->
        <div class="info-section">
            <h3>👨‍🏫 Encadrement</h3>
            @if($theme->type_sujet != 'stage')
                <div class="detail-row">
                    <span class="detail-label">Encadrant :</span>
                    <span class="detail-value">{{ $theme->encadrant->user->name }}</span>
                </div>
                @if($theme->id_co_encadrant)
                    <div class="detail-row">
                        <span class="detail-label">Co-encadrant :</span>
                        <span class="detail-value">{{ $theme->coEncadrant->user->name }}</span>
                    </div>
                @endif
            @else
                <div class="detail-row">
                    <span class="detail-label">Entreprise :</span>
                    <span class="detail-value">{{ $theme->entreprise_user->name }}</span>
                </div>
            @endif
        </div>

        <!-- Membres du groupe -->
        <div class="info-section">
            <h3>👥 Membres du Groupe</h3>
            <ul class="members-list">
                <li>{{ $group->student1->user->name }}</li>
                @if($group->student2)
                    <li>{{ $group->student2->user->name }}</li>
                @endif
            </ul>
        </div>

        <div class="alert alert-info">
            <strong>Prochaines étapes :</strong> Veuillez contacter votre encadrant pour planifier votre première réunion et discuter du planning de travail.
        </div>

        <div style="margin-top: 25px; color: #495057;">
            <p>Bonne continuation dans vos travaux !</p>
            <p>L'équipe pédagogique</p>
        </div>
    </div>

    <div class="footer">
        <p>Cet email a été envoyé automatiquement par le système de gestion des PFE.</p>
        <p>Pour toute question, veuillez contacter l'administration.</p>
    </div>
</body>
</html>