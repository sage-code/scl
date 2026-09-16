module c_api
  ! Bind(c) + iso_c_binding: a C-callable library with a fixed symbol
  ! name. Build with:  gfortran -shared -fPIC -o libc_api.so libc_api.f90
  use, intrinsic :: iso_c_binding, only: c_int, c_double
  implicit none
contains
  ! Exported to C with the exact name "scale_array" (no leading underscore).
  subroutine scale_array(n, arr, factor) bind(c, name="scale_array")
    integer(c_int), value :: n              ! C passes scalars BY VALUE
    real(c_double), intent(inout) :: arr(n) ! arrays stay by reference
    real(c_double), value :: factor
    arr = arr * factor
  end subroutine scale_array
end module c_api