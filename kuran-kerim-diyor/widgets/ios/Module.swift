import ExpoModulesCore
import WidgetKit

public class ExpoWidgetsModule: ExpoModulesCore.Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoWidgets")
        Function("setWidgetData") { (data: String) in
            let suite = UserDefaults(suiteName: "group.com.kurankerimdiyor.expowidgets")
            suite?.set(data, forKey: "MyData")
            suite?.set(data, forKey: "widgetdata")
            suite?.synchronize()
            UserDefaults.standard.set(data, forKey: "MyData")
            UserDefaults.standard.set(data, forKey: "widgetdata")
            UserDefaults.standard.synchronize()
            WidgetCenter.shared.reloadAllTimelines()
        }
    }
}
