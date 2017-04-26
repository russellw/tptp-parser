Parser for the TPTP file format.

```
tptp = require('tptp-parser')
p = tptp.parse(text[, file])
```

Supplying the name of the file from which the text was read is optional; if given, it will be used in error messages.

The return value is an object with the following fields:

```
formulas
```

A conjunction of formulas, represented as terms in the form defined by the `clause-normal-form` package.

```
conjecture
```

The conjecture, if there was one. It is already included in `formulas` in negated form, but a solver still needs to pay attention to this field if it outputs an answer in SZS form, which uses different wording depending on whether a conjecture was present.

```
status
```

The TPTP collection of logic problems comments each problem with its status where this is known. If `tptp-parser` finds such a comment in that format, it extracts and returns the status field. This is useful for testing solvers against a collection of known problems.
