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
            margin-bottom: 12px;
        }
        .detail-label {
            font-weight: bold;
            color: #495057;
            display: block;
            margin-bottom: 4px;
        }
        .detail-value {
            color: #212529;
            display: block;
            padding-left: 0;
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
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 12px;
            color: #6c757d;
            text-align: center;
        }
        .pfe-meta {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 15px;
        }
        .pfe-option {
            display: inline-block;
            background-color: #e9ecef;
            color: #495057;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.9em;
            font-weight: 500;
        }
        .pfe-type {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.9em;
            font-weight: bold;
            text-transform: uppercase;
        }
        .type-industrie {
            background-color: #d4edda;
            color: #155724;
        }
        .type-academique {
            background-color: #d1ecf1;
            color: #0c5460;
        }
        .type-recherche {
            background-color: #f8d7da;
            color: #721c24;
        }
        .type-stage {
            background-color: #fff3cd;
            color: #856404;
        }
        .resume-text {
            text-align: justify;
            line-height: 1.5;
        }
        .intro-text {
            margin-bottom: 15px;
            color: #495057;
        }
        
        /* Desktop layout */
        @media (min-width: 768px) {
            .detail-row {
                display: flex;
                align-items: flex-start;
            }
            .detail-label {
                min-width: 140px;
                margin-bottom: 0;
                margin-right: 10px;
                flex-shrink: 0;
            }
            .detail-value {
                flex: 1;
            }
        }
        
        /* Mobile responsiveness */
        @media (max-width: 767px) {
            body {
                padding: 10px;
                font-size: 14px;
            }
            .header {
                padding: 15px;
            }
            .header h1 {
                font-size: 1.4em;
            }
            .content {
                padding: 15px;
            }
            .info-section {
                padding: 12px;
            }
            .detail-row {
                margin-bottom: 15px;
            }
            .detail-label {
                font-size: 14px;
                margin-bottom: 6px;
            }
            .detail-value {
                font-size: 14px;
                line-height: 1.4;
            }
            .pfe-meta {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
            }
            .alert {
                padding: 10px;
                font-size: 14px;
            }
            .members-list li {
                padding: 8px 0;
                font-size: 14px;
            }
        }
        
        @media (max-width: 480px) {
            body {
                padding: 5px;
                font-size: 13px;
            }
            .header {
                padding: 10px;
            }
            .header h1 {
                font-size: 1.2em;
                line-height: 1.3;
            }
            .content {
                padding: 10px;
            }
            .info-section {
                padding: 10px;
                margin-bottom: 15px;
            }
            .info-section h3 {
                font-size: 1.1em;
            }
            .detail-label {
                font-size: 13px;
            }
            .detail-value {
                font-size: 13px;
            }
            .resume-text {
                font-size: 13px;
                line-height: 1.4;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎓 Attribution de votre Thème PFE</h1>
    </div>

    <div class="content">
        <div class="intro-text">
            <p><strong>Cher(e) {{ $recipient->name }},</strong></p>
            <p>Félicitations ! Votre thème PFE a été attribué. Voici les détails de votre projet :</p>
        </div>

        <div class="alert alert-success">
            <strong>🎉 Bonne nouvelle :</strong> Votre projet PFE a été officiellement attribué et vous pouvez maintenant commencer à travailler avec votre encadrant.
        </div>

        <!-- Informations du PFE -->
        <div class="info-section">
            <h3>📋 Projet de Fin d'Études</h3>
            <div class="detail-row">
                <span class="detail-label">Titre :</span>
                <span class="detail-value">{{ $pfes->first()->intitule }}</span>
            </div>
            <div class="pfe-meta">
                <div class="pfe-option">{{ $pfes->first()->option }}</div>
                <div class="pfe-type type-{{ strtolower($pfes->first()->type_sujet) }}">
                    {{ $pfes->first()->type_sujet }}
                </div>
            </div>
        </div>

        <!-- Détails du projet -->
        <div class="info-section">
            <h3>📝 Détails du Projet</h3>
            <div class="detail-row">
                <span class="detail-label">Résumé :</span>
                <span class="detail-value resume-text">{{ $pfes->first()->resume }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Technologies :</span>
                <span class="detail-value">{{ $pfes->first()->technologies_utilisees ?? 'Non spécifiées' }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Besoins Matériels :</span>
                <span class="detail-value">{{ $pfes->first()->besoins_materiels ?? 'Aucun besoin spécifique' }}</span>
            </div>
        </div>

        <!-- Membres du groupe -->
        <div class="info-section">
            <h3>👥 Membres du Groupe</h3>
            <ul class="members-list">
                <li>{{ $pfes->first()->group->student1->user->name }}</li>
                @if($pfes->first()->group->student2)
                    <li>{{ $pfes->first()->group->student2->user->name }}</li>
                @endif
            </ul>
        </div>

        <!-- Encadrement -->
        @if($pfes->first()->type_sujet != 'stage')
        <div class="info-section">
            <h3>👨‍🏫 Encadrement</h3>
            <div class="detail-row">
                <span class="detail-label">Encadrant :</span>
                <span class="detail-value">{{ $pfes->first()->encadrant->user->name }}</span>
            </div>
            @if($pfes->first()->coEncadrant)
                <div class="detail-row">
                    <span class="detail-label">Co-encadrant :</span>
                    <span class="detail-value">{{ $pfes->first()->coEncadrant->user->name }}</span>
                </div>
            @endif
        </div>
        @endif

        <div class="alert alert-info">
            <strong>Prochaines étapes :</strong> Contactez votre encadrant pour planifier votre première réunion et discuter des modalités de travail. Vous recevrez bientôt les informations concernant la date de soutenance.
        </div>
    </div>

    <div class="footer">
        <p>Cet email a été envoyé automatiquement par le système de gestion des PFE.</p>
        <p>Pour toute question, veuillez contacter l'administration.</p>
    </div>
</body>
</html>
