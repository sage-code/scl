module geometry
  ! Module: the shareable library unit. private by default, explicit API.
  implicit none
  private
  public :: area_of, perimeter_of

  real, parameter :: pi = 3.14159265358979   ! private constant

contains
  real function area_of(r)
    real, intent(in) :: r
    area_of = pi * r * r
  end function area_of

  real function perimeter_of(r)
    real, intent(in) :: r
    perimeter_of = 2.0 * pi * r
  end function perimeter_of
end module geometry

program module_use
  ! Consumers import only what they need and get checked interfaces.
  use geometry, only: area_of, perimeter_of
  implicit none
  real :: radius
  print '(a)', 'radius?'
  read *, radius
  print '(a,f8.3,a,f8.3)', 'area: ', area_of(radius), &
       '   perimeter: ', perimeter_of(radius)
end program module_use