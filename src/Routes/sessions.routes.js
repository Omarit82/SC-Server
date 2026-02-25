import {Router} from 'express';
import { logout,loginGoogle,getUser, getSession } from '../Controllers/sessions.controller.js';
import passport from 'passport';

const sessionsRouter = Router();

sessionsRouter.post('/logout',logout);
sessionsRouter.get('/api/user',getUser);
sessionsRouter.get('/api/session',getSession);
sessionsRouter.get('/auth/google',passport.authenticate('google', {scope: ['profile','email']}))
sessionsRouter.get('/auth/google/callback',passport.authenticate('google', {failureRedirect: '/session/login'}),loginGoogle)

export default sessionsRouter;