export const Briefing: React.FC = () => {
    return (
        <div className="briefing">
            <p>
                Given the goal to determine a driver's potential, the <i>Amostistic</i>, Average Percent Difference (APD), was created to capture a driver's race pace potential, relative to the other drivers in the league.
            </p>
            <p className="tldr">
                <span className="note">
                    TL;DR<br></br>
                    APD or Average Percent Difference is a number that captures a driver's potential race pace relative to all other driver's that have participated in SRA's GT3 Team Series Championship.
                </span>
            </p>
            <p><b>
                The steps to calculate race APD are as follows:
            </b></p>
            <ul>
                <li>Per race, per driver:</li>
                <ol>
                    <li>Sort a driver's valid laps.</li>
                    <li>Exclude the valid laps outside the inner-quartile range, resulting in laps within the middle 50% of a driver's valid laps.</li>
                    <li>
                        Calculate the average lap time of the remaining laps.<br></br>
                        <span className="note">Note: There must exist at least 5 laps in this middle-50% range for a driver's APD to be calculated (assuming 90-second lap times, 5 laps is about 1/8th of a 60-minute race). A driver also must have completed 75% of the race (assuming 90-second lap times, that's 30 out of 40 laps in a 60-minute race). The first condition let's us use shorter races, and the second condition ensures a driver is consistent enough to be considered for an APD.</span>
                    </li>
                </ol>
                <p><b>
                    At this point, we have a general idea of every driver's race pace for a given race.<br></br>
                    Next we need to compare each driver to their own division; the process is similar to above
                </b></p>

                <li>Per race, per division</li>
                <ol>
                    <li>Sort a division's valid laps.</li>
                    <li>Exclude the valid laps outside the inner-quartile range, resulting in laps within the middle 50% of the division's valid laps.</li>
                    <li>Calculate the average lap time of the remaining laps.</li>
                </ol>

                <p><b>
                    Now, we have a general idea of each each division's race pace, as well as each driver's race pace.<br></br>
                    Given team series races are virtually the same conditions across divisions, it's possible to compare a single driver to the entire league; that process is as follows.<br></br>
                </b></p>

                <li>Per race, per driver, per division</li>
                <ol>
                    <li>Calculate the percent difference of a driver's average middle-50% time divided by every other driver's middle 50% time in the same division.</li>
                    <ul>
                        <li><span className="math-example">Percent Difference = (Driver's Middle 50% Time / Other Driver's Middle 50% Time) - 1</span></li>
                        <li><span className="math-example">91 / 90 = 1.011 - 1 = +0.011</span></li>
                        <li><span className="math-example">89 / 90 = 0.988 - 1 = -0.011</span></li>
                    </ul>
                    <li>Average the percent differences per driver to get an APD that is comparable to every driver in the same race.</li>
                </ol>

                <p><b>
                    Now, each driver has been compared to their division, but these values are not yet comparable across the league. To do that, we need to compare each division's middle-50% time to each other. The process is similar to above.
                </b></p>

                <li>Per race, per division</li>
                <ol>
                    <li>Calculate the percent difference of a division's average middle-50% time divided by every other division's middle-50% time.</li>
                    <li>
                        Average the percent difference per division to get an APD that is comparable to the entire league.<br></br>
                        <span className="note">Note: A division's APD is used as an offset for a driver's APD, thus making a driver's APD comparable to the entire league.</span>
                    </li>
                </ol>

                <p><b>
                    Now, each division has an APD, and each driver has an APD. These APDs are combined per driver for each race. All that's left is to decide how many recent races we want to consider, then average a driver's APD over <i>n</i> races and compare drivers' potential race pace to each other.
                </b></p>
            </ul>

            <p><b>The steps to calcuate qualifying APD are as follows:</b></p>

            <p>It's literally the same except instead of using a drivers' average lap time (within the middle 50%), their potential best valid qualifying laps are used.</p><br></br>

            <span className="note">
                Other notes:
                <ul>
                    <li>Using the middle-50% lap times, we exclude outliers, letting us focus on the core of a driver's/division's average race pace.</li>
                    <li>Using only valid laps attempts to ensure only clean laps are used in the calculation - because again, the goal is to determine potential and not represent results.</li>
                    <li>It was mentioned above, divisions are comparable because they are raced in virtually the same conditions, this is true, but this also means rain races are not comparable.</li>
                </ul>
            </span>
        </div >
    );
};