------------------------------------------------------------------------------
-- 11_geometry.adb — package body: the hidden implementation.
--
-- Bodies are compiled after their spec and are invisible to clients.
-- GNAT requires this file to be named geometry.adb (spec: geometry.ads)
-- so it can pair them automatically. Compile via 12_package_main.adb.
------------------------------------------------------------------------------
package body Geometry is

   --  Expression-function bodies keep the package body almost empty —
   --  the interesting part is the spec's contracts, not this code.

   function Make (Side : Float) return Square is
     ((Side => Side));                    --  record aggregate as a body

   function Area (S : Square) return Float is
     (S.Side * S.Side);

   function Side_Of (S : Square) return Float is
     (S.Side);

begin
   null;   --  optional elaboration: runs once before any client code
end Geometry;
