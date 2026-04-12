export const generateTripSchedule = (dateStr, timeStr, returnDateStr, returnTimeStr, routeLegs, strategy, tripType) => {
  const SPEED_KMPH = 45; // Conservative average speed including breaks
  
  if (!routeLegs || routeLegs.length === 0) return [];

  const isTwoWay = tripType === 'two-way';
  const outboundSum = routeLegs.reduce((acc, leg) => acc + leg.distance, 0);
  
  // Helper to safely parse strings into Dates
  const parseDateTime = (d, t) => {
    if (!d || !t) return null;
    // Ensure time doesn't have multiple colons or second fragments if we're adding :00
    const cleanTime = t.includes(':') && t.split(':').length >= 3 ? t : `${t}:00`;
    const dateObj = new Date(`${d}T${cleanTime}`);
    return isNaN(dateObj.getTime()) ? null : dateObj;
  };

  const outboundStart = parseDateTime(dateStr, timeStr);
  if (!outboundStart) return [];

  // Phase 1: Outbound
  const outboundPhase = {
    start: outboundStart,
    legs: routeLegs.map(l => ({ name: l.name, dist: l.distance, type: 'outbound', durationHalt: l.durationHalt }))
  };

  const phases = [outboundPhase];

  // Phase 2: Inbound
  if (isTwoWay) {
    const inboundStart = parseDateTime(returnDateStr, returnTimeStr);
    if (inboundStart) {
      phases.push({
        start: inboundStart,
        legs: [{ name: 'Return Home', dist: outboundSum, type: 'return' }]
      });
    }
  }

  const schedule = [];
  let globalCurrentTime = null;
  
  phases.forEach((phase, pIdx) => {
    let phaseStart = new Date(phase.start);
    
    // Safety check: Return journey cannot start before outbound journey reaches destination
    if (globalCurrentTime && phaseStart < globalCurrentTime) {
      // Add a 1-hour buffer for rest/halting at the destination before starting return
      phaseStart = new Date(globalCurrentTime.getTime() + (60 * 60 * 1000));
    }

    let currentTime = new Date(phaseStart);
    const GRACE_PERIOD_HOURS = 2.0; 
    
    // Announce the start of the Phase
    schedule.push({
      type: 'leg_start',
      title: phase.legs[0].type === 'outbound' ? 'Start Outbound Journey' : 'Begin Return Journey',
      time: new Date(currentTime),
      desc: (globalCurrentTime && phaseStart > new Date(phase.start))
        ? `Delayed start (Safety Buffer) as outbound arrival was late.`
        : `Departing.`
    });

    phase.legs.forEach((leg, lIdx) => {
      let legRemaining = leg.dist;
      
      while (legRemaining > 0) {
        const currentHourDec = currentTime.getHours() + (currentTime.getMinutes() / 60) + (currentTime.getSeconds() / 3600);
        const isNight = currentHourDec >= 22 || currentHourDec < 6;
        const hoursNeeded = legRemaining / SPEED_KMPH;

        // Calculate how many hours are left before the mandatory 10 PM halt
        let hoursUntilHalt = 22 - currentHourDec;
        if (hoursUntilHalt < 0) hoursUntilHalt = 0;

        // GRACE PERIOD LOGIC: 
        // If we can finish the remaining leg distance by pushing up to GRACE_PERIOD_HOURS (until 11:59 PM),
        // we allow the drive to continue instead of halting.
        const canFinishWithGrace = (strategy === 'day-only' && currentHourDec >= 6 && currentHourDec <= 22) && 
                                   (hoursNeeded <= hoursUntilHalt + GRACE_PERIOD_HOURS);

        if (isNight && strategy === 'day-only' && !canFinishWithGrace) {
          const isAtStart = currentTime.getTime() === phase.start.getTime();
          
          if (isAtStart) {
            // If starting AT night in Day-Only mode, simulate 'Waiting for Morning' 
            // instead of a confusing 'Depart -> Halt' at the same minute.
            const resumeMorning = new Date(currentTime);
            if (currentHourDec >= 22) resumeMorning.setDate(resumeMorning.getDate() + 1);
            resumeMorning.setHours(6, 0, 0, 0);
            
            schedule.push({
              type: 'halt',
              title: 'Awaiting Morning (Day-Only Policy)',
              time: new Date(currentTime),
              desc: 'Pickup is at night but Standard policy starts at 6:00 AM.'
            });
            
            currentTime = resumeMorning;
            schedule.push({
              type: 'resume',
              title: 'Journey Resumes',
              time: new Date(currentTime),
              desc: 'Driving starts as per Standard Day schedule.'
            });
          } else {
            schedule.push({
              type: 'halt',
              title: 'Night Halt',
              time: new Date(currentTime),
              desc: ''
            });
            
            // Snap strictly to 6:00 AM next morning
            const resumeTime = new Date(currentTime);
            if (currentHourDec >= 22) {
              resumeTime.setDate(resumeTime.getDate() + 1);
            }
            resumeTime.setHours(6, 0, 0, 0);
            currentTime = resumeTime;
            
            schedule.push({
              type: 'resume',
              title: 'Journey Resumes',
              time: new Date(currentTime),
              desc: 'Resuming journey.'
            });
          }
          continue;
        }

        let hoursCanDrive = strategy === 'day-only' ? (canFinishWithGrace ? 24 : 22 - currentHourDec) : 24;

        if (hoursNeeded <= hoursCanDrive) {
          // Finish this leg!
          const preciseTime = new Date(currentTime.getTime() + hoursNeeded * 60 * 60 * 1000);
          // Round to nearest 5 minutes
          const roundedMs = Math.round(preciseTime.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000);
          currentTime = new Date(roundedMs);
          
          legRemaining = 0;
          
          schedule.push({
            type: 'leg_end',
            title: `Reach: ${leg.name}`,
            time: new Date(currentTime),
            desc: canFinishWithGrace && currentTime.getHours() >= 22
              ? `Reached via late-night extension. (Driving after 10 PM: ₹150/hr charge applies).`
              : `Completed leg (${leg.dist.toFixed(0)} KM).`
          });

          // Phase 4 UX: Simulate explicitly requested User Halts at this stop
          if (leg.durationHalt) {
            if (leg.durationHalt === -1) {
              schedule.push({
                type: 'halt',
                title: `Overnight Stay: ${leg.name}`,
                time: new Date(currentTime),
                desc: 'Journey resumes tomorrow.'
              });
              
              const currentHourHalt = currentTime.getHours() + (currentTime.getMinutes() / 60);
              const resumeTime = new Date(currentTime);
              // If it's already past 6AM, jump to the NEXT day's 6AM.
              if (currentHourHalt >= 6) {
                resumeTime.setDate(resumeTime.getDate() + 1);
              }
              resumeTime.setHours(6, 0, 0, 0);
              currentTime = resumeTime;
              
              schedule.push({
                type: 'resume',
                title: `Depart: ${leg.name}`,
                time: new Date(currentTime),
                desc: 'Departing after overnight stay.'
              });
            } else if (leg.durationHalt > 0) {
              schedule.push({
                type: 'halt',
                title: `Halt: ${leg.name}`,
                time: new Date(currentTime),
                desc: `Scheduled break for ${leg.durationHalt} hour(s).`
              });
              
              currentTime = new Date(currentTime.getTime() + (leg.durationHalt * 60 * 60 * 1000));
              
              const postHaltHourDec = currentTime.getHours() + (currentTime.getMinutes() / 60);
              const isHaltInNight = (postHaltHourDec >= 22 || postHaltHourDec < 6);

              if (strategy === 'day-only' && isHaltInNight) {
                schedule.push({
                  type: 'halt',
                  desc: ''
                });
                
                if (postHaltHourDec >= 22) currentTime.setDate(currentTime.getDate() + 1);
                currentTime.setHours(6, 0, 0, 0);
              }

              schedule.push({
                type: 'resume',
                title: `Depart: ${leg.name}`,
                time: new Date(currentTime),
                desc: 'Journey resumes.'
              });
            }
          }
        } else {
          // Hit the time limit (10 PM)
          currentTime = new Date(currentTime.getTime() + hoursCanDrive * 60 * 60 * 1000);
          legRemaining -= hoursCanDrive * SPEED_KMPH;
          
          if (strategy === 'expedited') {
            schedule.push({
              type: 'progress',
              title: 'Driving through the night',
              time: new Date(currentTime),
              desc: `Expedited journey continuing.`
            });
          }
        }
      }
    });
    globalCurrentTime = currentTime;
  });

  return schedule;
};
