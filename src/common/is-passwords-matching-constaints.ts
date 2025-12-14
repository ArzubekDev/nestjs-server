import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { RegisterDto } from "src/auth/dto/register.dto";

@ValidatorConstraint({name: "IspasswordsMatching", async: false})
export class IspasswordsMatchingConstraint implements ValidatorConstraintInterface {
    public validate(passwordRepeat: string, args: ValidationArguments) {
        const obj = args.object as RegisterDto
        return obj.password === passwordRepeat
    }
    public defaultMessage(validationArguments?: ValidationArguments): string {
        return "Пароли не совпадают."
    }
}