<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attribution Jury PFE - Évaluations</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
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
        }
        .members-list {
            list-style: none;
            padding: 0;
            margin: 5px 0;
        }
        .members-list li {
            padding: 12px 15px;
            margin-bottom: 8px;
            background-color: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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
        /* Role section styling */
        .role-section {
            margin-bottom: 30px;
        }
        .role-header {
            background-color: #007bff;
            color: white;
            padding: 12px 20px;
            border-radius: 5px;
            margin: 0 0 20px 0;
            font-size: 1.1em;
            font-weight: bold;
        }
        .role-header.examinateur {
            background-color: #17a2b8;
        }
        /* Desktop table styling */
        .pfe-table-container {
            overflow-x: auto;
            margin-bottom: 20px;
        }
        .pfe-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            overflow: hidden;
            min-width: 850px;
        }
        .pfe-table th {
            background-color: #f8f9fa;
            color: #495057;
            font-weight: bold;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #dee2e6;
            font-size: 0.9em;
        }
        .pfe-table td {
            padding: 12px;
            border-bottom: 1px solid #e9ecef;
            vertical-align: top;
        }
        .pfe-table tr:last-child td {
            border-bottom: none;
        }
        .pfe-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .pfe-table tr:hover {
            background-color: #e3f2fd;
        }
        /* PFE content styling */
        .pfe-title {
            font-weight: bold;
            color: #007bff;
            margin-bottom: 5px;
            line-height: 1.3;
        }
        .pfe-option {
            display: inline-block;
            background-color: #e9ecef;
            color: #495057;
            padding: 4px 10px;
            border-radius: 15px;
            font-size: 0.85em;
            margin-bottom: 5px;
            font-weight: bold;
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
        .resume-text, .technologies-text {
            word-wrap: break-word;
            line-height: 1.4;
            max-width: 250px;
        }
        .students-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .students-list li {
            padding: 4px 0;
            color: #495057;
        }
        .encadrant-info {
            color: #495057;
            font-size: 0.9em;
        }
        .encadrant-info strong {
            color: #007bff;
        }
        .no-pfes {
            text-align: center;
            color: #6c757d;
            font-style: italic;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
        }
        .intro-text {
            margin-bottom: 15px;
            color: #495057;
        }
        .summary-stats {
            display: flex;
            justify-content: space-around;
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
            border: 1px solid #dee2e6;
        }
        .stat-item {
            text-align: center;
            flex: 1;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #007bff;
            display: block;
        }
        .stat-label {
            color: #6c757d;
            font-size: 0.9em;
            text-transform: uppercase;
        }
        /* Mobile card layout */
        .pfe-cards {
            display: none;
        }
        .pfe-card {
            background-color: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .pfe-card-header {
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e9ecef;
        }
        .pfe-card-content {
            display: grid;
            gap: 10px;
        }
        /* Desktop layout for cards */
        @media (min-width: 768px) {
            .pfe-card .detail-row {
                display: flex;
                align-items: flex-start;
            }
            .pfe-card .detail-label {
                min-width: 150px;
                margin-bottom: 0;
                margin-right: 15px;
                flex-shrink: 0;
            }
            .pfe-card .detail-value {
                flex: 1;
            }
            .summary-stats {
                flex-direction: row;
            }
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
            /* Hide table, show cards */
            .pfe-table-container {
                display: none;
            }
            .pfe-cards {
                display: block;
            }
            .role-header {
                padding: 10px 15px;
                font-size: 1em;
            }
            .pfe-card .detail-row {
                margin-bottom: 15px;
            }
            .pfe-card .detail-label {
                font-size: 14px;
                margin-bottom: 6px;
            }
            .pfe-card .detail-value {
                font-size: 14px;
                line-height: 1.4;
            }
            .summary-stats {
                flex-direction: column;
                gap: 15px;
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
            .pfe-card {
                padding: 15px;
            }
            .role-header {
                padding: 8px 12px;
                font-size: 0.9em;
            }
            .pfe-card .detail-label {
                font-size: 13px;
            }
            .pfe-card .detail-value {
                font-size: 13px;
            }
            .detail-label {
                font-size: 13px;
            }
            .detail-value {
                font-size: 13px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚖️ Attribution Jury PFE {{ date('Y') }}</h1>
    </div>

    <div class="content">
        <div class="intro-text">
            <p><strong>Bonjour {{ $member->nom ?? 'Cher membre du jury' }},</strong></p>
            <p>Vous avez été désigné(e) pour participer à l'évaluation des projets PFE suivants :</p>
        </div>

        @php
            $pfesPresident = $pfes->filter(function($pfe) use ($member) {
                return $pfe->jury && $pfe->jury->id_president == $member->id;
            });
            $pfesExaminateur = $pfes->filter(function($pfe) use ($member) {
                return $pfe->jury && $pfe->jury->id_examinateur == $member->id;
            });
            $totalPfes = $pfesPresident->count() + $pfesExaminateur->count();
        @endphp

        <div class="summary-stats">
            <div class="stat-item">
                <span class="stat-number">{{ $totalPfes }}</span>
                <span class="stat-label">Total Projets</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">{{ $pfesPresident->count() }}</span>
                <span class="stat-label">Comme Président</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">{{ $pfesExaminateur->count() }}</span>
                <span class="stat-label">Comme Examinateur</span>
            </div>
        </div>

        @if($pfesPresident->count() > 0)
        <div class="role-section">
            <h2 class="role-header">
                🏆 PFE où vous êtes Président de Jury ({{ $pfesPresident->count() }} projet{{ $pfesPresident->count() > 1 ? 's' : '' }})
            </h2>

            <!-- Desktop Table View -->
            <div class="pfe-table-container">
                <table class="pfe-table">
                    <thead>
                        <tr>
                            <th>Projet</th>
                            <th>Résumé</th>
                            <th>Technologies</th>
                            <th>Encadrement</th>
                            <th>Examinateur</th>
                            <th>Groupe</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($pfesPresident as $pfe)
                        <tr>
                            <td>
                                <div class="pfe-title">{{ $pfe->intitule }}</div>
                                <div class="pfe-option">{{ $pfe->option }}</div>
                                <div class="pfe-type type-{{ strtolower($pfe->type_sujet) }}">
                                    {{ $pfe->type_sujet }}
                                </div>
                            </td>
                            <td>
                                <div class="resume-text">{{ $pfe->resume }}</div>
                            </td>
                            <td>
                                <div class="technologies-text">{{ $pfe->technologies_utilisees ?? 'Non spécifiées' }}</div>
                            </td>
                            <td>
                                <div class="encadrant-info">
                                    <strong>Encadrant:</strong> {{ $pfe->encadrant->user->name ?? 'Non défini' }}
                                    @if($pfe->coEncadrant)
                                        <br><strong>Co-encadrant:</strong> {{ $pfe->coEncadrant->user->name }}
                                    @endif
                                </div>
                            </td>
                            <td>
                                @if($pfe->jury && $pfe->jury->examinateur)
                                    {{ $pfe->jury->examinateur->user->name }}
                                    <br><small style="color: #6c757d;">{{ $pfe->jury->examinateur->grade }}</small>
                                @else
                                    <span style="color: #dc3545;">Non défini</span>
                                @endif
                            </td>
                            <td>
                                @if($pfe->group)
                                    <ul class="students-list">
                                        <li>👤 {{ $pfe->group->student1->user->name }}</li>
                                        @if($pfe->group->student2)
                                            <li>👤 {{ $pfe->group->student2->user->name }}</li>
                                        @endif
                                    </ul>
                                @else
                                    <span style="color: #dc3545;">Groupe non défini</span>
                                @endif
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>

            <!-- Mobile Card View -->
            <div class="pfe-cards">
                @foreach($pfesPresident as $pfe)
                <div class="pfe-card">
                    <div class="pfe-card-header">
                        <div class="pfe-title">{{ $pfe->intitule }}</div>
                        <div class="pfe-option">{{ $pfe->option }}</div>
                        <div class="pfe-type type-{{ strtolower($pfe->type_sujet) }}">
                            {{ $pfe->type_sujet }}
                        </div>
                    </div>
                    <div class="pfe-card-content">
                        <div class="detail-row">
                            <span class="detail-label">Résumé :</span>
                            <span class="detail-value">{{ $pfe->resume }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Technologies :</span>
                            <span class="detail-value">{{ $pfe->technologies_utilisees ?? 'Non spécifiées' }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Encadrement :</span>
                            <div class="detail-value">
                                <div class="encadrant-info">
                                    <strong>Encadrant:</strong> {{ $pfe->encadrant->user->name ?? 'Non défini' }}
                                    @if($pfe->coEncadrant)
                                        <br><strong>Co-encadrant:</strong> {{ $pfe->coEncadrant->user->name }}
                                    @endif
                                </div>
                            </div>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Examinateur :</span>
                            <span class="detail-value">
                                @if($pfe->jury && $pfe->jury->examinateur)
                                    {{ $pfe->jury->examinateur->user->name }}
                                    <br><small style="color: #6c757d;">{{ $pfe->jury->examinateur->grade }}</small>
                                @else
                                    <span style="color: #dc3545;">Non défini</span>
                                @endif
                            </span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Groupe :</span>
                            <div class="detail-value">
                                @if($pfe->group)
                                    <ul class="members-list">
                                        <li>👤 {{ $pfe->group->student1->user->name }}</li>
                                        @if($pfe->group->student2)
                                            <li>👤 {{ $pfe->group->student2->user->name }}</li>
                                        @endif
                                    </ul>
                                @else
                                    <span style="color: #dc3545;">Groupe non défini</span>
                                @endif
                            </div>
                        </div>
                    </div>
                </div>
                @endforeach
            </div>
        </div>
        @endif

        @if($pfesExaminateur->count() > 0)
        <div class="role-section">
            <h2 class="role-header examinateur">
                🔍 PFE où vous êtes Examinateur ({{ $pfesExaminateur->count() }} projet{{ $pfesExaminateur->count() > 1 ? 's' : '' }})
            </h2>

            <!-- Desktop Table View -->
            <div class="pfe-table-container">
                <table class="pfe-table">
                    <thead>
                        <tr>
                            <th>Projet</th>
                            <th>Résumé</th>
                            <th>Technologies</th>
                            <th>Encadrement</th>
                            <th>Président</th>
                            <th>Groupe</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($pfesExaminateur as $pfe)
                        <tr>
                            <td>
                                <div class="pfe-title">{{ $pfe->intitule }}</div>
                                <div class="pfe-option">{{ $pfe->option }}</div>
                                <div class="pfe-type type-{{ strtolower($pfe->type_sujet) }}">
                                    {{ $pfe->type_sujet }}
                                </div>
                            </td>
                            <td>
                                <div class="resume-text">{{ $pfe->resume }}</div>
                            </td>
                            <td>
                                <div class="technologies-text">{{ $pfe->technologies_utilisees ?? 'Non spécifiées' }}</div>
                            </td>
                            <td>
                                <div class="encadrant-info">
                                    <strong>Encadrant:</strong> {{ $pfe->encadrant->user->name ?? 'Non défini' }}
                                    @if($pfe->coEncadrant)
                                        <br><strong>Co-encadrant:</strong> {{ $pfe->coEncadrant->user->name }}
                                    @endif
                                </div>
                            </td>
                            <td>
                                @if($pfe->jury && $pfe->jury->president)
                                    {{ $pfe->jury->president->user->name }}
                                    <br><small style="color: #6c757d;">{{ $pfe->jury->president->grade }}</small>
                                @else
                                    <span style="color: #dc3545;">Non défini</span>
                                @endif
                            </td>
                            <td>
                                @if($pfe->group)
                                    <ul class="students-list">
                                        <li>👤 {{ $pfe->group->student1->user->name }}</li>
                                        @if($pfe->group->student2)
                                            <li>👤 {{ $pfe->group->student2->user->name }}</li>
                                        @endif
                                    </ul>
                                @else
                                    <span style="color: #dc3545;">Groupe non défini</span>
                                @endif
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>

            <!-- Mobile Card View -->
            <div class="pfe-cards">
                @foreach($pfesExaminateur as $pfe)
                <div class="pfe-card">
                    <div class="pfe-card-header">
                        <div class="pfe-title">{{ $pfe->intitule }}</div>
                        <div class="pfe-option">{{ $pfe->option }}</div>
                        <div class="pfe-type type-{{ strtolower($pfe->type_sujet) }}">
                            {{ $pfe->type_sujet }}
                        </div>
                    </div>
                    <div class="pfe-card-content">
                        <div class="detail-row">
                            <span class="detail-label">Résumé :</span>
                            <span class="detail-value">{{ $pfe->resume }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Technologies :</span>
                            <span class="detail-value">{{ $pfe->technologies_utilisees ?? 'Non spécifiées' }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Encadrement :</span>
                            <div class="detail-value">
                                <div class="encadrant-info">
                                    <strong>Encadrant:</strong> {{ $pfe->encadrant->user->name ?? 'Non défini' }}
                                    @if($pfe->coEncadrant)
                                        <br><strong>Co-encadrant:</strong> {{ $pfe->coEncadrant->user->name }}
                                    @endif
                                </div>
                            </div>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Président :</span>
                            <span class="detail-value">
                                @if($pfe->jury && $pfe->jury->president)
                                    {{ $pfe->jury->president->user->name }}
                                    <br><small style="color: #6c757d;">{{ $pfe->jury->president->grade }}</small>
                                @else
                                    <span style="color: #dc3545;">Non défini</span>
                                @endif
                            </span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Groupe :</span>
                            <div class="detail-value">
                                @if($pfe->group)
                                    <ul class="members-list">
                                        <li>👤 {{ $pfe->group->student1->user->name }}</li>
                                        @if($pfe->group->student2)
                                            <li>👤 {{ $pfe->group->student2->user->name }}</li>
                                        @endif
                                    </ul>
                                @else
                                    <span style="color: #dc3545;">Groupe non défini</span>
                                @endif
                            </div>
                        </div>
                    </div>
                </div>
                @endforeach
            </div>
        </div>
        @endif

        <div class="alert alert-info">
            <strong>📅 Information importante :</strong> Les dates et horaires des soutenances vous seront communiqués ultérieurement. Vous recevrez une notification détaillée avec le planning complet.
        </div>

        <div class="alert alert-warning">
            <strong>⚠️ Rappel :</strong> En tant que membre du jury, vous êtes tenu(e) d'évaluer les projets selon les critères académiques établis. Votre présence est obligatoire lors des soutenances.
        </div>
    </div>

    <div class="footer">
        <p>Cet email a été envoyé automatiquement par le système de gestion des PFE.</p>
        <p>Pour toute question concernant votre rôle de jury ou les projets assignés, veuillez contacter l'administration académique.</p>
    </div>
</body>
</html>
