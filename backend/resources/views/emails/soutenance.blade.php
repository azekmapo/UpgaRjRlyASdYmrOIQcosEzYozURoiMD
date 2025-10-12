<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $type === 'creation' ? 'Nouvelle soutenance' : 'Modification de soutenance' }}</title>
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
        <h1>
            @if($type === 'creation')
                🎓 Nouvelle Soutenance Programmée
            @else
                📝 Modification de Soutenance
            @endif
        </h1>
    </div>

    <div class="content">
        @if($type === 'creation')
            <div class="alert alert-info">
                <strong>Information :</strong> Une nouvelle soutenance a été programmée pour votre projet.
            </div>
        @else
            <div class="alert alert-warning">
                <strong>Attention :</strong> Les détails de votre soutenance ont été modifiés.
            </div>
        @endif

        <!-- Informations du PFE -->
        <div class="info-section">
            <h3>📋 Projet de Fin d'Études</h3>
            <div class="detail-row">
                <span class="detail-label">Titre :</span>
                <span class="detail-value">{{ $soutenance->pfe->intitule ?? 'Non spécifié' }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Option :</span>
                <span class="detail-value">{{ $soutenance->pfe->option ?? 'Non spécifiée' }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Session :</span>
                <span class="detail-value">{{ ucfirst($soutenance->session) }}</span>
            </div>
        </div>

        <!-- Informations de la soutenance -->
        <div class="info-section">
            <h3>📅 Détails de la Soutenance</h3>
            <div class="detail-row">
                <span class="detail-label">Date :</span>
                <span class="detail-value">{{ $dateFormatted }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Heure :</span>
                <span class="detail-value">{{ $heureDebut }} - {{ $heureFin }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Salle :</span>
                <span class="detail-value">{{ $soutenance->salle->nom_salle ?? 'Non spécifiée' }}</span>
            </div>
        </div>

        <!-- Membres du groupe -->
        @if($soutenance->pfe && $soutenance->pfe->group)
        <div class="info-section">
            <h3>👥 Membres du Groupe</h3>
            <ul class="members-list">
                @if($soutenance->pfe->group->student1User)
                    <li>{{ $soutenance->pfe->group->student1User->name }}</li>
                @endif
                @if($soutenance->pfe->group->student2User)
                    <li>{{ $soutenance->pfe->group->student2User->name }}</li>
                @endif
            </ul>
        </div>
        @endif

        <!-- Encadrement -->
        <div class="info-section">
            <h3>👨‍🏫 Encadrement</h3>
            @if($soutenance->pfe->encadrantUser)
                <div class="detail-row">
                    <span class="detail-label">Encadrant :</span>
                    <span class="detail-value">{{ $soutenance->pfe->encadrantUser->name }}</span>
                </div>
            @endif
            @if($soutenance->pfe->coEncadrantUser)
                <div class="detail-row">
                    <span class="detail-label">Co-encadrant :</span>
                    <span class="detail-value">{{ $soutenance->pfe->coEncadrantUser->name }}</span>
                </div>
            @endif
        </div>

        <!-- Membres du jury -->
        @if($soutenance->pfe && $soutenance->pfe->jury)
        <div class="info-section">
            <h3>⚖️ Membres du Jury</h3>
            @if($soutenance->pfe->jury->presidentUser)
                <div class="detail-row">
                    <span class="detail-label">Président :</span>
                    <span class="detail-value">{{ $soutenance->pfe->jury->presidentUser->name }}</span>
                </div>
            @endif
            @if($soutenance->pfe->jury->examinateurUser)
                <div class="detail-row">
                    <span class="detail-label">Examinateur :</span>
                    <span class="detail-value">{{ $soutenance->pfe->jury->examinateurUser->name }}</span>
                </div>
            @endif
        </div>
        @endif

        <div class="alert alert-info">
            <strong>Rappel :</strong> Veuillez vous présenter 15 minutes avant l'heure prévue dans la salle indiquée.
        </div>
    </div>

    <div class="footer">
        <p>Cet email a été envoyé automatiquement par le système de gestion des soutenances.</p>
        <p>Pour toute question, veuillez contacter l'administration.</p>
    </div>
</body>
</html>
