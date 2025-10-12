<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attribution PFE - Groupes Encadrés</title>
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
            border-radius: 8px;
            margin: 0 0 20px 0;
            font-size: 1.1em;
            font-weight: bold;
        }
        .role-header.co-encadrant {
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
            min-width: 800px;
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
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            margin-bottom: 5px;
        }
        .pfe-type {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
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
        
        /* Text content - allow wrapping, no ellipsis */
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
            padding: 2px 0;
            color: #495057;
        }
        .students-list li:before {
            content: "👤 ";
            margin-right: 5px;
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
        
        /* Mobile card layout */
        .pfe-cards {
            display: none;
        }
        
        .pfe-card {
            background-color: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
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
                min-width: 140px;
                margin-bottom: 0;
                margin-right: 10px;
                flex-shrink: 0;
            }
            .pfe-card .detail-value {
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
                padding: 12px;
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
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📚 Attribution PFE {{ date('Y') }}</h1>
    </div>

    <div class="content">
        <div class="intro-text">
            <p><strong>Bonjour {{ $recipient->name }},</strong></p>
            <p>Voici les détails des projets PFE qui vous ont été attribués pour cette session :</p>
        </div>

        @php
            $pfesEncadrant = $pfes->filter(function($pfe) use ($recipient) {
                return $pfe->id_encadrant == $recipient->enseignant->id;
            });
            $pfesCoEncadrant = $pfes->filter(function($pfe) use ($recipient) {
                return $pfe->id_co_encadrant == $recipient->enseignant->id;
            });
        @endphp

        @if($pfesEncadrant->count() > 0)
        <div class="role-section">
            <h2 class="role-header">🎯 PFE où vous êtes Encadrant Principal ({{ $pfesEncadrant->count() }} projet{{ $pfesEncadrant->count() > 1 ? 's' : '' }})</h2>
            
            <!-- Desktop Table View -->
            <div class="pfe-table-container">
                <table class="pfe-table">
                    <thead>
                        <tr>
                            <th>Projet</th>
                            <th>Résumé</th>
                            <th>Technologies</th>
                            <th>Besoins Matériels</th>
                            <th>Co-encadrant</th>
                            <th>Groupe</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($pfesEncadrant as $pfe)
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
                            <td>{{ $pfe->besoins_materiels ?? 'Aucun' }}</td>
                            <td>{{ $pfe->coEncadrant->user->name ?? 'Aucun' }}</td>
                            <td>
                                <ul class="students-list">
                                    <li>{{ $pfe->group->student1->user->name }}</li>
                                    @if($pfe->group->student2)
                                        <li>{{ $pfe->group->student2->user->name }}</li>
                                    @endif
                                </ul>
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>

            <!-- Mobile Card View -->
            <div class="pfe-cards">
                @foreach($pfesEncadrant as $pfe)
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
                            <span class="detail-label">Besoins Matériels :</span>
                            <span class="detail-value">{{ $pfe->besoins_materiels ?? 'Aucun' }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Co-encadrant :</span>
                            <span class="detail-value">{{ $pfe->coEncadrant->user->name ?? 'Aucun' }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Groupe :</span>
                            <div class="detail-value">
                                <ul class="members-list">
                                    <li>{{ $pfe->group->student1->user->name }}</li>
                                    @if($pfe->group->student2)
                                        <li>{{ $pfe->group->student2->user->name }}</li>
                                    @endif
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                @endforeach
            </div>
        </div>
        @endif

        @if($pfesCoEncadrant->count() > 0)
        <div class="role-section">
            <h2 class="role-header co-encadrant">🤝 PFE où vous êtes Co-encadrant ({{ $pfesCoEncadrant->count() }} projet{{ $pfesCoEncadrant->count() > 1 ? 's' : '' }})</h2>
            
            <!-- Desktop Table View -->
            <div class="pfe-table-container">
                <table class="pfe-table">
                    <thead>
                        <tr>
                            <th>Projet</th>
                            <th>Résumé</th>
                            <th>Technologies</th>
                            <th>Besoins Matériels</th>
                            <th>Encadrant Principal</th>
                            <th>Groupe</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($pfesCoEncadrant as $pfe)
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
                            <td>{{ $pfe->besoins_materiels ?? 'Aucun' }}</td>
                            <td>{{ $pfe->encadrant->user->name }}</td>
                            <td>
                                <ul class="students-list">
                                    <li>{{ $pfe->group->student1->user->name }}</li>
                                    @if($pfe->group->student2)
                                        <li>{{ $pfe->group->student2->user->name }}</li>
                                    @endif
                                </ul>
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>

            <!-- Mobile Card View -->
            <div class="pfe-cards">
                @foreach($pfesCoEncadrant as $pfe)
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
                            <span class="detail-label">Besoins Matériels :</span>
                            <span class="detail-value">{{ $pfe->besoins_materiels ?? 'Aucun' }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Encadrant Principal :</span>
                            <span class="detail-value">{{ $pfe->encadrant->user->name }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Groupe :</span>
                            <div class="detail-value">
                                <ul class="members-list">
                                    <li>{{ $pfe->group->student1->user->name }}</li>
                                    @if($pfe->group->student2)
                                        <li>{{ $pfe->group->student2->user->name }}</li>
                                    @endif
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                @endforeach
            </div>
        </div>
        @endif

        @if($pfesEncadrant->count() == 0 && $pfesCoEncadrant->count() == 0)
        <div class="no-pfes">
            <p>Aucun projet PFE ne vous a été attribué pour cette session.</p>
        </div>
        @endif

        <div class="alert alert-info">
            <strong>Information :</strong> Vous recevrez d'autres notifications concernant les dates de soutenances et les détails du jury une fois qu'ils seront programmés.
        </div>
    </div>

    <div class="footer">
        <p>Cet email a été envoyé automatiquement par le système de gestion des PFE.</p>
        <p>Pour toute question, veuillez contacter l'administration.</p>
    </div>
</body>
</html>
