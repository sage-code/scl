program derived_types
  ! A derived type bundles data into one value: definition, constructor,
  ! % access, default initializers, and arrays of records.
  implicit none
  type :: station
    character(len=24) :: name = "unnamed"
    real(8) :: lat = 0.0d0, lon = 0.0d0
    integer :: altitude = 0
  end type station

  type(station) :: a, b
  type(station) :: network(2)

  a = station(name="Chur", lat=46.85d0, lon=9.53d0, altitude=556)
  b = a                       ! value copy: b is fully independent
  b%name = "Zurich"
  b%altitude = 408

  network(1) = station("Jungfrau", 46.55d0, 7.98d0, 3571)
  network(2) = station("Lugano", 46.00d0, 8.95d0, 273)

  print '(a,a,1x,a)', 'a: ', trim(a%name), 'b: ' // trim(b%name)
  print '(a,i0)', 'a altitude: ', a%altitude
  print '(a,i0)', 'highest network station #', maxloc(network%altitude, dim=1)
end program derived_types