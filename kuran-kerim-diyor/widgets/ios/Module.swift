import ExpoModulesCore
import WidgetKit

public class ExpoWidgetsModule: ExpoModulesCore.Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoWidgets")
        Function("setWidgetData") { (data: String) in
            UserDefaults(suiteName: "group.com.kurankerimdiyor.expowidgets")?.set(data, forKey: "MyData")
            WidgetCenter.shared.reloadAllTimelines()
        }
    }
}
