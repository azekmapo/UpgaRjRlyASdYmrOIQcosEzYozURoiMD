<?php

namespace App\Http\Controllers;

use App\Models\PasswordReset;
use Illuminate\Support\Facades\Mail;
use App\Mail\PasswordResetCode;
use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;


class ForgotPasswordController extends Controller
{
    public function sendResetCode(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'email' => 'required|email'
            ], [
                'email.required' => 'Veuillez fournir une adresse email.',
                'email.email' => 'Veuillez fournir une adresse email valide.',
            ]);

            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tu n\'as pas de compte avec cette adresse email dans notre platforme.',
                    'errors' => [
                        'email' => ['Cet email n\'existe pas dans notre système.']
                    ]
                ], 422);
            }

            $code_generer = substr(str_shuffle('0123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ'), 0, 4);
            $expires_at_code = Carbon::now()->addMinutes(1);

            DB::beginTransaction();

            PasswordReset::where('email', $request->email)->delete();

            PasswordReset::create([
                'email' => $request->email,
                'code' => $code_generer,
                'expires_at_code' => $expires_at_code,
            ]);

            try {
                Mail::to($request->email)->send(new PasswordResetCode($code_generer));
            } catch (\Exception $e) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de l\'envoi du code de réinitialisation de mot de passe',
                ], 500);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Code de vérification envoyé avec succès',
                'email' => $request->email
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Une erreur s\'est produite lors de l\'envoi du code de réinitialisation de mot de passe',
            ], 500);
        }
    }

    public function verifyCode(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'code' => 'required|string',
                'email' => 'required|email',
            ]);

            $code = $request->code;
            $email = $request->email;

            $passwordReset = PasswordReset::where('email', $email)
                ->where('code', $code)
                ->first();

            if (!$passwordReset) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ton code est incorrect',
                ], 422);
            }

            if (Carbon::now()->gt($passwordReset->expires_at_code)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ton code est expiré',
                ], 422);
            }

            $token = Str::random(60);
            $passwordReset->update([
                'token' => $token,
                'expires_at_token' => Carbon::now()->addMinutes(10)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Code vérifié avec succès',
                'token' => $token,
                'email' => $email
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification du code',
            ], 500);
        }
    }

    public function changePassword(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'code' => 'required|string',
                'token' => 'required|string',
                'new_password' => 'required|min:8',
                'confirm_password' => 'required|same:new_password|min:8',
            ], [
                'email.required' => 'Veuillez fournir une adresse email valide.',
                'code.required' => 'Veuillez fournir un code valide.',
                'token.required' => 'Veuillez fournir un jeton valide.',
                'new_password.required' => 'Veuillez fournir un nouveau mot de passe valide.',
                'new_password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
                'confirm_password.required' => 'Veuillez fournir un mot de passe de confirmation valide.',
                'confirm_password.same' => 'Le mot de passe ne correspond pas.',
                'confirm_password.min' => 'Le mot de passe de confirmation doit contenir au moins 8 caractères.',
            ]);

            $email = $request->email;
            $code = $request->code;
            $token = $request->token;
            $new_password = $request->new_password;

            $passwordReset = PasswordReset::where('email', $email)
                ->where('code', $code)
                ->where('token', $token)
                ->first();

            if (!$passwordReset) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jeton invalide ou expiré',
                ], 422);
            }

            if (Carbon::now()->gt($passwordReset->expires_at_token)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ton jeton est expiré',
                ], 422);
            }

            $user = User::where('email', $email)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non trouvé',
                ], 404);
            }

            DB::beginTransaction();

            $user->update(['password' => bcrypt($new_password)]);

            $passwordReset->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Votre mot de passe a été changé avec succès. Vous pouvez maintenant vous connecter.',
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du changement de mot de passe',
            ], 500);
        }
    }
}
