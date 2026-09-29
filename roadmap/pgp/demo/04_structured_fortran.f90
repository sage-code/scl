! 04 - Structured programming: Fortran, one of the languages that made this
! paradigm famous (alongside Algol, Pascal, Modula, and Ada).
program grade_report
    implicit none
    integer :: score, i
    character :: grade

    score = 74

    ! Decision
    if (score >= 90) then
        grade = 'A'
    else if (score >= 80) then
        grade = 'B'
    else if (score >= 70) then
        grade = 'C'
    else
        grade = 'F'
    end if

    print *, 'Score ', score, ' -> Grade ', grade

    ! Repetition
    do i = 1, 3
        print *, 'Pass ', i, ' of 3'
    end do

    ! Selection
    select case (grade)
        case ('A')
            print *, 'Excellent'
        case ('B')
            print *, 'Good'
        case ('C')
            print *, 'Passing'
        case default
            print *, 'Needs improvement'
    end select
end program grade_report
