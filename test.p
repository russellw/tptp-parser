% Test formulas from TPTP SYN000+1
% Status   : Theorem

%----Propositional
fof(propositional,axiom,
    ( ( p0
      & ~ q0 )
   => ( r0
      | ~ s0 ) )).

%----First-order
fof(first_order,axiom,(
    ! [X] :
      ( ( p(X)
        | ~ q(X,a) )
     => ? [Y,Z] :
          ( r(X,f(Y),g(X,f(Y),Z))
          & ~ s(f(f(f(b)))) ) ) )).

%----Roles
fof(role_hypothesis,hypothesis,(
    p(h) )).

%----Numbers
fof(integers,axiom,
    ( p(12)
    | p(-12) )).
