program mpi_ring
  ! MPI point-to-point: a message travels around a ring of ranks.
  ! Build & run:  mpifort mpi_ring.f90 -o ring && mpiexec -n 4 ./ring
  use mpi_f08
  implicit none
  integer :: rank, size, ierr, next, prev, tag
  integer :: token

  call MPI_Init(ierr)
  call MPI_Comm_rank(MPI_COMM_WORLD, rank, ierr)
  call MPI_Comm_size(MPI_COMM_WORLD, size, ierr)

  next = mod(rank + 1, size)         ! neighbours on the ring
  prev = mod(rank - 1 + size, size)
  tag = 99

  if (rank == 0) then
     token = 42
     call MPI_Send(token, 1, MPI_INTEGER, next, tag, MPI_COMM_WORLD, ierr)
     call MPI_Recv(token, 1, MPI_INTEGER, prev, tag, MPI_COMM_WORLD, &
                   MPI_STATUS_IGNORE, ierr)
     print '(a,i0,a,i0,a)', 'rank 0 got token ', token, ' after ', size, ' hops'
  else
     call MPI_Recv(token, 1, MPI_INTEGER, prev, tag, MPI_COMM_WORLD, &
                   MPI_STATUS_IGNORE, ierr)
     token = token + 1
     call MPI_Send(token, 1, MPI_INTEGER, next, tag, MPI_COMM_WORLD, ierr)
     print '(a,i0,a,i0)', 'rank ', rank, ' forwarded token ', token
  end if

  call MPI_Finalize(ierr)
end program mpi_ring