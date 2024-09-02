hook(){
  test -z "$1" && { echo "usage: hook <cmd_or_jsfunction> [args]"; return 0; } 
  cmd=$1
  shift 
  test -d ~/hook.d/$cmd && {
    find ~/hook.d/$cmd/ -type f -executable | while read hook; do 
      { $hook "$@" || true; } |  awk '{ gsub(/\/root\/\//,"",$1); $1 = sprintf("%-40s", $1)} 1'
    done
  }
}

alert(){
  test -z "$1" && { echo "usage: alert <title> <message>"; return 0; } 
  title=$1
  test -z "$1" || shift
  msg="$*"
  printf "[38;5;165m%s \033[0m%s\n" "$title" "$msg"
  hook alert $title "$msg" 
}

confirm(){
  test -z "$1" && { echo "usage: confirm <question>"; return 0; } 
  read -p "$(printf "\033[0m")[?] [38;5;165m$1 [y/n] $(printf "\033[0m")" y
  test $y = y && echo true && return 0
  test $y = y || echo false 
  hook confirm $1 $y
}

prompt(){
  test -z "$1" && { echo "usage: prompt <question> [answer_default]"; return 0; } 
  test -n "$2" && answer="[$2] " && answer_fallback="$2"
  read -p "$(printf "\033[0m")[?] [38;5;165m$1: $answer $(printf "\033[0m")" answer
  test -z "$answer" && answer="$answer_fallback"
  echo "$answer"
  hook prompt $1 $answer
}
