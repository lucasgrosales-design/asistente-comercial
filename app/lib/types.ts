export type Status="nuevo"|"en_conversacion"|"seguimiento"|"venta"|"perdido"|"inactivo";
export type Opportunity={id:string;contact_name:string;phone:string|null;need:string|null;product:string|null;intent:string|null;status:Status;current_summary:string|null;next_action:string|null;next_action_at:string|null;assigned_user_name:string|null;updated_at:string};
export type Interaction={id:string;occurred_at:string;channel:string;summary:string;outcome:string|null;user_name:string|null};
