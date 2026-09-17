------------------------------------------------------------------------------
-- 11_geometry.ads — package specification: the contract clients compile against.
--
-- The visible part declares the API. The private part hides the record
-- internals: clients cannot read Side directly, so Make can enforce the
-- invariant "side > 0" for EVERY object in existence.
------------------------------------------------------------------------------
package Geometry is

   --  A private type: clients know it exists, not what is inside.
   type Square is private;

   --  The API:
   function Make (Side : Float) return Square
     with Pre => Side > 0.0;           --  contract: caller must pass a positive side

   function Area (S : Square) return Float;
   function Side_Of (S : Square) return Float;

private
   --  Hidden implementation detail — changeable without touching clients:
   type Square is record
      Side : Float;
   end record;

end Geometry;
