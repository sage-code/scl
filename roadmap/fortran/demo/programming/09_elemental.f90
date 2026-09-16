program elemental_f
  ! An ELEMENTAL function has one scalar body but is callable with whole
  ! arrays: the compiler applies it element-wise at the call site.
  implicit none
  real :: cities(3) = [-5.0, 12.0, 27.0]
  real :: scalars(3)

  print '(3f8.2)', fahrenheit(cities)      ! whole-array call

  scalars = fahrenheit(cities(1))          ! scalar result broadcast
  print '(3f8.2)', scalars

contains
  elemental real function fahrenheit(c)
    real, intent(in) :: c
    fahrenheit = c * 9.0 / 5.0 + 32.0      ! C to F conversion
  end function fahrenheit
end program elemental_f