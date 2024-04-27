import { AlertType } from "../../enums/alert-type.enum";

export interface Alert {
    type?: AlertType;
    title?: string;
    message?: string;
  }