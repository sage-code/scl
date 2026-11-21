(* Algebraic data type (AST) and exhaustive pattern-matching evaluator in OCaml. *)

type expr =
  | Int of int
  | Add of expr * expr
  | Mul of expr * expr
  | Let of string * expr * expr
  | Var of string

let rec eval (env : (string * int) list) (e : expr) : int =
  match e with
  | Int n -> n
  | Add (a, b) -> eval env a + eval env b
  | Mul (a, b) -> eval env a * eval env b
  | Var name ->
      (match List.assoc_opt name env with
       | Some v -> v
       | None -> failwith ("Unbound variable: " ^ name))
  | Let (name, value_expr, body) ->
      let v = eval env value_expr in
      eval ((name, v) :: env) body

let () =
  (* let x = 3 in (x + 4) * 2 *)
  let ast = Let ("x", Int 3, Mul (Add (Var "x", Int 4), Int 2)) in
  Printf.printf "Result = %d\n" (eval [] ast)
