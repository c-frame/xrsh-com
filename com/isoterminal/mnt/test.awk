#!/bin/awk -f

BEGIN {
    for (i = 1; i < ARGC; i++) {
        options[i] = ARGV[i]
    }
    ARGC = 0
    selected = 1
    n = length(options)

    while (1) {
	printf "\r                                              "
        for (i = 1; i <= n; i++) {
            if (i == selected) 
                printf "\033[44m%s\033[0m ", options[i]
            else 
                printf "%s ", options[i]
        }
        if (c == 0) {
            getline dir < "/dev/stdin"
	    print dir
            if (dir == "up" && selected > 1) selected--
            if (dir == "down" && selected < n) selected++
        }
    }
}
