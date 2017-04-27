% Test formulas from TPTP SYN000+1
% Status   : Theorem

%----Propositional
fof(propositional,axiom,
    ( ( p0
      & ~ q0 )
   => ( r0
      | ~ s0 ) )).

%----Roles
fof(role_hypothesis,hypothesis,(
    p(h) )).

%----Numbers
fof(integers,axiom,
    ( p(12)
    | p(-12) )).
