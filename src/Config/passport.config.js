import passport from "passport";
import local from 'passport-local';
import GoogleStrategy from 'passport-google-oauth20';
import { encriptar,checkPassword } from "../utils/bcrypt.js";
import { userModel } from "../Models/user.model.js";

const localStrategy = local.Strategy;

export const initializedPassport = () =>{

    /**Google */
    passport.use(new GoogleStrategy({clientID:process.env.CLIENT_ID, clientSecret:process.env.CLIENT_SECRET, callbackURL: "/auth/google/callback"},
        async function(accessToken,refreshToken,profile,done){   
            try {
                let user = await userModel.findOne({googleId:profile.id});
                if(!user){
                    user = await userModel.create({
                        googleId:profile.id, 
                        email:profile.emails[0].value,
                        nombre:profile.name.givenName,
                        apellido:profile.name.familyName,
                        password:encriptar(process.env.GOOGLE_PASS),
                        avatar:profile.photos[0].value
                    })
                }
                done(null,user);
            } catch (error) {
                done(error)
            }
        }
    ))

    passport.serializeUser((user,done)=>{
        done(null,user._id);
    })

    passport.deserializeUser(async(id,done)=>{
        const user= await userModel.findById(id);
        done(null,user);
    })
}

export const ensureAuthenticate = (req,res,next) => {
    if(req.isAuthenticated()){
        return next();
    }
    res.status(401).redirect('/auth/google');
}