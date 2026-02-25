import { hashSync,genSaltSync,compareSync } from "bcrypt";

export const encriptar = (pass) => {
    return hashSync(pass,genSaltSync(parseInt(process.env.SALT)));
}

export const checkPassword = (pass,original) => {
    return compareSync(pass,original);
}