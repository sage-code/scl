program arrays_slices
  ! Arrays are the language, not a library: constructors, implied-do,
  ! contiguous memory order, slicing with strides, and WHERE guards.
  implicit none
  integer :: squares(5)
  integer :: v(10) = [1,2,3,4,5,6,7,8,9,10]
  real :: u(5) = [1.0, -2.0, 3.0, -4.0, 5.0]
  integer :: i

  ! array constructor with an implied-do loop (the list comprehension)
  squares = [(i*i, i = 1, size(squares))]
  print '(a,5i3)', 'squares: ', squares

  ! slicing: v(3:6), odd elements, reversed, from the start
  print '(a,4i3)', 'v(3:6)        ', v(3:6)
  print '(a,4i3)', 'v(1:9:2)      ', v(1:9:2)
  print '(a,5i3)', 'v(10:1:-2)    ', v(10:1:-2)
  print '(a,5i3)', 'v(:5)         ', v(:5)

  ! WHERE selects per element without a loop
  where (u < 0.0)
     u = 0.0
  elsewhere
     u = u * 2.0
  end where
  print '(a,5f5.1)', 'clamped+scaled: ', u
end program arrays_slices