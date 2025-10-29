<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Periode;
use Carbon\Carbon;

class CheckRoleAndPeriod
{
    public function handle(Request $request, Closure $next, ...$params): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Authentication required'
            ], 401);
        }

        if ($user->role === 'enseignant' && !$user->relationLoaded('enseignant')) {
            $user->load('enseignant');
        }

        $roles = isset($params[0]) ? $params[0] : '';
        $periods = isset($params[1]) ? $params[1] : '';

        $allowedRoles = !empty($roles) ? array_map('trim', explode('+', $roles)) : [];
        $allowedPeriods = !empty($periods) ? array_map('trim', explode('+', $periods)) : [];

        if (!$this->checkRole($user, $allowedRoles)) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => 'Insufficient permissions'
            ], 403);
        }

        if (!$this->checkPeriod($allowedPeriods)) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => 'Access not allowed during this period'
            ], 403);
        }

        return $next($request);
    }

    private function checkRole($user, array $allowedRoles): bool
    {
        if (empty($allowedRoles)) {
            return false;
        }

        if (in_array('tout', $allowedRoles, true)) {
            return true;
        }

        $userRole = $user->role;

        if (in_array($userRole, $allowedRoles, true)) {
            return true;
        }

        if (in_array('responsable', $allowedRoles, true) && $userRole === 'enseignant') {
            $enseignant = $user->enseignant;
            if ($enseignant && $enseignant->is_responsable) {
                return true;
            }
        }

        return false;
    }

    private function checkPeriod(array $allowedPeriods): bool
    {
        if (empty($allowedPeriods)) {
            return false;
        }

        if (in_array('tout', $allowedPeriods, true)) {
            return true;
        }

        $now = Carbon::now();

        $activePeriods = Periode::where('date_debut', '<=', $now)
            ->where('date_fin', '>=', $now)
            ->pluck('id')
            ->toArray();

        foreach ($activePeriods as $activePeriodId) {
            if (in_array((string)$activePeriodId, $allowedPeriods, true)) {
                return true;
            }
        }

        return false;
    }
}