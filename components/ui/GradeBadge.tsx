interface GradeBadgeProps {
  grade: string;
  size?: "sm" | "md" | "lg";
}

function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return "grade-a";
  if (grade.startsWith("B")) return "grade-b";
  if (grade === "C") return "grade-c";
  if (grade === "D") return "grade-d";
  return "grade-f";
}

const sizes = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-xs px-2 py-0.5",
  lg: "text-sm px-3 py-1",
};

export default function GradeBadge({ grade, size = "md" }: GradeBadgeProps) {
  return (
    <span
      className={`inline-block font-mono font-bold border rounded-md ${gradeColor(grade)} ${sizes[size]}`}
    >
      {grade}
    </span>
  );
}
