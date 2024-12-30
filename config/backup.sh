#!/bin/sh
if ! restic snapshots > /dev/null 2>&1; then
  echo 'Initializing repository';
  restic init;
else
  echo 'Repository exists';
fi;

while true; do
  echo 'Starting backup...';
  restic backup /data;
  echo 'Backup complete. Running forget and prune...';
  restic forget --keep-last 3 --prune;
  
  SECONDS_UNTIL_NEXT_BACKUP=86400;  # 24 hours in seconds
  
  while [ ${SECONDS_UNTIL_NEXT_BACKUP} -gt 0 ]; do
    HOURS=$((SECONDS_UNTIL_NEXT_BACKUP / 3600));
    MINUTES=$(((SECONDS_UNTIL_NEXT_BACKUP % 3600) / 60));
    SECONDS=$((SECONDS_UNTIL_NEXT_BACKUP % 60));
    
    echo "Time until next backup: ${HOURS}h ${MINUTES}m ${SECONDS}s";
    sleep 60;
    SECONDS_UNTIL_NEXT_BACKUP=$((SECONDS_UNTIL_NEXT_BACKUP - 60));
  done
done
