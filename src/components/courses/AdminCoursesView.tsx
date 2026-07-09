import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminCourseProgress from "@/components/admin/AdminCourseProgress";
import AdminCourseBuilder from "@/components/admin/AdminCourseBuilder";

const AdminCoursesView = () => {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Courses</h1>
      <Tabs defaultValue="progress">
        <TabsList className="font-body">
          <TabsTrigger value="progress">Participant Progress</TabsTrigger>
          <TabsTrigger value="builder">Course Builder</TabsTrigger>
        </TabsList>
        <TabsContent value="progress" className="mt-4">
          <AdminCourseProgress />
        </TabsContent>
        <TabsContent value="builder" className="mt-4">
          <AdminCourseBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCoursesView;

// Legacy code below kept commented for reference — replaced by tabbed view above.
/*
const _Legacy = () => {
  const [allProgress, setAllProgress] = useState<ProgressRow[]>([]);
};
*/
