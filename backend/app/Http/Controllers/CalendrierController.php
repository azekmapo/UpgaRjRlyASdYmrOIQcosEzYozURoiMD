<?php

namespace App\Http\Controllers;

use App\Models\Periode;
use Illuminate\Http\Request;

class CalendrierController extends Controller
{
    public function index()
    {
        $user = auth()->user(); // Fetch the authenticated user (optional if needed)
        $periodes = Periode::orderBy('id', 'asc')->get(); // Fetch all periodes

        return response()->json([
            'success' => true,
            'periodes' => $periodes,
        ]);
    }
}
