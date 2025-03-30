import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import { getAuth } from "firebase/auth";
import ProgressCircle from "./Circle";

const PerformanceTracker = () => {
  const [percentage, setPercentage] = useState(0);
  const auth = getAuth();
  const db = getDatabase();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const gradesRef = ref(db, `grades/${user.uid}`);
    const unsubscribe = onValue(gradesRef, (snapshot) => {
      const grades = snapshot.val();
      const calculatedPercentage = calculatePerformance(grades);
      setPercentage(calculatedPercentage);
    });

    return () => unsubscribe();
  }, []);

  const calculatePerformance = (gradesData) => {
    if (!gradesData) return 0;

    let totalWeight = 0;
    let totalGrades = 0;

    Object.keys(gradesData).forEach((subject) => {
      Object.keys(gradesData[subject]).forEach((date) => {
        const grade = gradesData[subject][date];
        const numericGrade =
          typeof grade === "string" ? parseInt(grade, 10) : grade;

        if (!isNaN(numericGrade)) {
          const weight =
            numericGrade === 5
              ? 1
              : numericGrade === 4
              ? 0.8
              : numericGrade === 3
              ? 0.5
              : 0;

          totalWeight += weight;
          totalGrades++;
        }
      });
    });

    return totalGrades > 0 ? Math.round((totalWeight / totalGrades) * 100) : 0;
  };

  return <ProgressCircle percentage={percentage} />;
};

export default PerformanceTracker;
