subroutine euler_step(n, dt, y, ynext)
  ! One explicit Euler step: ynext = y + dt*sin(y). F2PY discovers
  ! intent(out) and returns ynext automatically to Python.
  ! Build:  python -m numpy.f2py -c euler.f90 -m easolver
  implicit none
  integer, intent(in) :: n
  real(8), intent(in) :: dt, y(n)
  real(8), intent(out) :: ynext(n)
  ynext = y + dt * sin(y)     ! whole-array math — vectorizes cleanly
end subroutine euler_step